from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import io
import json
from collections import Counter
import re

# Import authentication and database
from database import create_tables, get_db, User
from auth import (
    UserCreate, UserLogin, UserResponse, Token, 
    create_user, authenticate_user, create_access_token, 
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta

app = FastAPI(title="Survey Analysis API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Global variable to store the current dataset
current_dataset = None
dataset_info = None

@app.get("/")
async def root():
    return {"message": "Survey Analysis API is running"}

# Authentication endpoints
@app.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        user = create_user(user_data, db)
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse.from_orm(user)
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    user = authenticate_user(user_data.email, user_data.password, db)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user)
):
    """Upload and process survey data file"""
    global current_dataset, dataset_info
    
    try:
        # Read file content
        contents = await file.read()
        
        # Determine file type and read accordingly
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel files.")
        
        current_dataset = df
        
        # Generate dataset info
        total_columns = len(df.columns)
        mc_columns = df.columns[:-3].tolist()  # Multiple choice columns
        text_columns = df.columns[-3:].tolist()  # Text response columns
        
        dataset_info = {
            "filename": file.filename,
            "total_responses": len(df),
            "total_questions": total_columns,
            "multiple_choice_questions": len(mc_columns),
            "text_questions": len(text_columns),
            "mc_column_names": mc_columns,
            "text_column_names": text_columns,
            "upload_success": True,
            "uploaded_by": current_user.email
        }
        
        return dataset_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/dataset-info")
async def get_dataset_info(current_user: User = Depends(get_current_user)):
    """Get information about the current dataset"""
    if dataset_info is None:
        raise HTTPException(status_code=404, detail="No dataset uploaded")
    return dataset_info

@app.get("/multiple-choice-analysis")
async def get_multiple_choice_analysis(current_user: User = Depends(get_current_user)):
    """Analyze multiple choice questions"""
    if current_dataset is None:
        raise HTTPException(status_code=404, detail="No dataset uploaded")
    
    try:
        df = current_dataset
        mc_columns = df.columns[:-3]
        
        analysis = {}
        
        for column in mc_columns:
            # Get value counts
            value_counts = df[column].value_counts()
            
            # Calculate percentages
            percentages = (value_counts / len(df) * 100).round(2)
            
            # Prepare data for charts
            chart_data = []
            for value, count in value_counts.items():
                if pd.notna(value):  # Skip NaN values
                    chart_data.append({
                        "label": str(value),
                        "value": int(count),
                        "percentage": float(percentages[value])
                    })
            
            analysis[column] = {
                "question": column,
                "total_responses": int(df[column].count()),
                "unique_values": int(df[column].nunique()),
                "value_counts": value_counts.to_dict(),
                "percentages": percentages.to_dict(),
                "chart_data": chart_data,
                "missing_values": int(df[column].isnull().sum())
            }
        
        return {
            "analysis": analysis,
            "summary": {
                "total_questions": len(mc_columns),
                "avg_response_rate": float(df[mc_columns].count().mean() / len(df) * 100)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing multiple choice data: {str(e)}")

@app.get("/text-analysis")
async def get_text_analysis(current_user: User = Depends(get_current_user)):
    """Analyze text response questions"""
    if current_dataset is None:
        raise HTTPException(status_code=404, detail="No dataset uploaded")
    
    try:
        df = current_dataset
        text_columns = df.columns[-3:]
        
        analysis = {}
        
        for column in text_columns:
            # Filter out null values
            text_data = df[column].dropna()
            
            if len(text_data) == 0:
                analysis[column] = {
                    "question": column,
                    "total_responses": 0,
                    "avg_length": 0,
                    "word_count": {},
                    "common_words": [],
                    "sample_responses": []
                }
                continue
            
            # Calculate text statistics
            lengths = text_data.str.len()
            
            # Word frequency analysis
            all_text = ' '.join(text_data.astype(str))
            # Simple word extraction (remove punctuation and convert to lowercase)
            words = re.findall(r'\b[a-zA-Z]+\b', all_text.lower())
            # Filter out common stop words
            stop_words = {'the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'on', 'are', 'this', 'be', 'at', 'by', 'i', 'you', 'we', 'they', 'have', 'had', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'do', 'does', 'did', 'get', 'go', 'going', 'come', 'came', 'see', 'know', 'think', 'say', 'said', 'tell', 'told', 'give', 'gave', 'take', 'took', 'make', 'made', 'find', 'found', 'work', 'working', 'worked', 'use', 'used', 'using', 'want', 'wanted', 'need', 'needed', 'help', 'helped', 'look', 'looking', 'looked', 'like', 'liked', 'time', 'year', 'day', 'way', 'people', 'man', 'woman', 'child', 'children', 'good', 'great', 'bad', 'new', 'old', 'first', 'last', 'long', 'little', 'own', 'other', 'right', 'left', 'high', 'low', 'big', 'small', 'large', 'short', 'easy', 'hard', 'difficult', 'important', 'real', 'sure', 'different', 'similar', 'same', 'next', 'following', 'previous', 'above', 'below', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who', 'which', 'whose', 'whom', 'very', 'quite', 'really', 'actually', 'just', 'only', 'also', 'even', 'still', 'already', 'yet', 'again', 'back', 'up', 'down', 'out', 'over', 'under', 'through', 'between', 'among', 'during', 'before', 'after', 'since', 'until', 'while', 'because', 'if', 'unless', 'although', 'though', 'however', 'therefore', 'thus', 'so', 'but', 'or', 'nor', 'either', 'neither', 'both', 'all', 'any', 'some', 'many', 'much', 'few', 'several', 'each', 'every', 'no', 'not', 'never', 'always', 'often', 'sometimes', 'usually', 'generally', 'probably', 'possibly', 'perhaps', 'maybe', 'yes', 'no'}
            
            filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
            word_freq = Counter(filtered_words)
            
            # Get top 10 most common words
            common_words = [{"word": word, "count": count} for word, count in word_freq.most_common(10)]
            
            # Sample responses (first 5 non-null responses)
            sample_responses = text_data.head(5).tolist()
            
            analysis[column] = {
                "question": column,
                "total_responses": int(len(text_data)),
                "avg_length": float(lengths.mean()) if len(lengths) > 0 else 0,
                "min_length": int(lengths.min()) if len(lengths) > 0 else 0,
                "max_length": int(lengths.max()) if len(lengths) > 0 else 0,
                "common_words": common_words,
                "sample_responses": sample_responses,
                "missing_values": int(df[column].isnull().sum())
            }
        
        return {
            "analysis": analysis,
            "summary": {
                "total_text_questions": len(text_columns),
                "avg_response_rate": float(df[text_columns].count().mean() / len(df) * 100)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing text data: {str(e)}")

@app.get("/cross-tabulation/{question1}/{question2}")
async def get_cross_tabulation(
    question1: str, 
    question2: str, 
    current_user: User = Depends(get_current_user)
):
    """Generate cross-tabulation between two multiple choice questions"""
    if current_dataset is None:
        raise HTTPException(status_code=404, detail="No dataset uploaded")
    
    try:
        df = current_dataset
        
        if question1 not in df.columns or question2 not in df.columns:
            raise HTTPException(status_code=400, detail="One or both questions not found in dataset")
        
        # Create cross-tabulation
        crosstab = pd.crosstab(df[question1], df[question2], margins=True)
        
        # Convert to format suitable for frontend
        crosstab_data = []
        for index in crosstab.index:
            row_data = {"question1_value": str(index)}
            for col in crosstab.columns:
                row_data[str(col)] = int(crosstab.loc[index, col])
            crosstab_data.append(row_data)
        
        return {
            "question1": question1,
            "question2": question2,
            "crosstab_data": crosstab_data,
            "columns": [str(col) for col in crosstab.columns]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating cross-tabulation: {str(e)}")

@app.get("/summary-stats")
async def get_summary_stats(current_user: User = Depends(get_current_user)):
    """Get overall summary statistics"""
    if current_dataset is None:
        raise HTTPException(status_code=404, detail="No dataset uploaded")
    
    try:
        df = current_dataset
        
        # Overall statistics
        total_responses = len(df)
        total_questions = len(df.columns)
        mc_questions = len(df.columns) - 3
        text_questions = 3
        
        # Response completeness
        completeness = {}
        for column in df.columns:
            response_rate = (df[column].count() / total_responses) * 100
            completeness[column] = {
                "question": column,
                "response_rate": float(response_rate),
                "missing_count": int(df[column].isnull().sum())
            }
        
        # Average response rates
        mc_columns = df.columns[:-3]
        text_columns = df.columns[-3:]
        
        avg_mc_response_rate = float(df[mc_columns].count().mean() / total_responses * 100)
        avg_text_response_rate = float(df[text_columns].count().mean() / total_responses * 100)
        
        return {
            "total_responses": total_responses,
            "total_questions": total_questions,
            "multiple_choice_questions": mc_questions,
            "text_questions": text_questions,
            "avg_mc_response_rate": avg_mc_response_rate,
            "avg_text_response_rate": avg_text_response_rate,
            "question_completeness": completeness
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary statistics: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)