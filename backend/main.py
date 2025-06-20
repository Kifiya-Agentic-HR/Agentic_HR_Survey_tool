from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Security, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import io
import json
from collections import Counter
import re
from rapidfuzz import fuzz
import pandas as pd
import os
import glob
from dotenv import load_dotenv
load_dotenv()

# Import authentication and database
from database import create_tables, get_db, User, EventLog, AccessLog, hash_password, verify_password
from auth import (
    UserCreate, UserLogin, UserResponse, Token, 
    create_user, authenticate_user, create_access_token, 
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, AdminUserCreate
)
from llm_analysis import llm_analyzer
from datetime import timedelta
import pandas as pd
from fuzzywuzzy import process
from audit import log_event, log_access


# Define the correct headers
English_headers = [
    "How long have you been with the company?",	
    "Which department do you work in?",
    "How familiar are you with the company's stated values?",
    "How clearly do you understand your team's goal and the broader organization objectives?",
    "How well do you understand your role within your team and the broader organization?",
    "To what extent do you feel a sense of belonging within your team or the broader organization?",
    "How effective is communication between your team and other departments in fostering a unified company culture?",
    "How well do you believe leadership demonstrates behaviors that support a positive and inclusive workplace culture?",
    "How respected and fairly treated do you feel in your workplace interactions?",
    "How well does the organization's culture support employees in adapting to changes \n",
    "To what extent does the company culture support your ability to maintain a healthy balance between work and personal life?",
    "How comfortable do you feel providing honest feedback about the workplace culture without fear of negative consequences? ",
    "I have opportunities for professional growth and development.",
    "My workload is manageable.",
    "I am fairly compensated for my work.",
    "I feel a sense of belonging at Kifya.",
    "How likely are you to recommend this company to a friend as a great place to work?",
    "Do you see yourself working here one year from now? ",
    "What is one thing you enjoy most about working at Kifya?",
    "What is one area of the company you believe could be improved, and how?",
    "Do you have any additional feedback or comments you'd like to share?"
]

def clean_df(df):   
    
    amharic_to_english_dict = {
        "ከ 6 ወር ያነሰ": "Less than 6 months",
        "ከ 6 ወር እስከ 1 ዓመት": "6 months to 1 year",
        "ከ 1 እስከ 3 ዓመታት": "1 to 3 years" ,
        "ከ 3 እስከ 5 ዓመታት": "3 to 5 years",
        "ከ 5 ዓመታት በላይ":"More than 5 years",
        "1 እስከ 3 ዓመታት": "1 to 3 years",
        "6 ወር ያነሰ": "Less than 6 months",
        "6 ወር እስከ 1 ዓመት": "6 months to 1 year",

        "1 እስከ 3 ዓመታት": "1 to 3 years" ,
        "3 እስከ 5 ዓመታት": "3 to 5 years",
        "5 ዓመታት በላይ":"More than 5 years",
        "ከ 3 እስከ 5 አመት":"3 to 5 years",


        # Departments
        "ፋይናንስ": "Finance",
        # Familiarity/Effectiveness/Agreement Scales

        "በጣም በደንብ": "Very familiar",
        "በጣም ብደንብ":"Very familiar",
        "በተወሰነ ደረጃ": "Somewhat",
        "በተወሰነ ደርጃ": "Somewhat",
        "በተወሰነ ደርጃ": "Somewhat",
        "ገለልተኛ": "Neutral",
        "በደንብ አይደለም": "Not very well",
        "በጭራሽ":"Not at all",

        "በጣም በግልጽ": "Very clearly",
        "በተወሰነ ደረጃ በግልጽ": "Somewhat clearly",
        "በተወሰነ ደርጃ በግልጽ": "Somewhat clearly",
        
        "ገለልተኛ":"Neutral",
        "በደንብ ግልጽ አይደለም":"Not Clear",
        "በጭራሽ ግልጽ አይደለም":"Not Clear at All",

        "በጣም በደንብ":"Very well",
        "በተወሰነ ደረጃ በደንብ":"Somewhat well",
        "በተወሰነ ደርጃ በደንብ":"Somewhat well",
        "ገለልተኛ":"Neutral",
        "በደንብ አይደለም":"Not very well",
        "በጭራሽ":"Not at all",

        "ብዙ ጊዜ": "Often",
        "አልፎ አልፎ": "Sometimes",
        "ሁልጊዜ": "Always",
        "በጭራሽ": "Rarely",
        "ምንም": "Not at all",

        "በጣም ውጤታማ":"Very effective",
        "በተወሰነ ደረጃ ውጤታማ":"Somewhat effective",
        "በትወሰነ ደረጃ ውጤታማ": "Somewhat effective",
        "ገለልተኛ":"Neutral",
        "በተወሰነ ደረጃ ውጤታማ ያልሆነ":"Somewhat ineffective",
        "በጣም ውጤታማ ያልሆነ":"Not very effective",

        "እጅግ በጣም በደንብ":"Extremely well",
        "እጅግ በጣም በደንብ":"Extremely well",
        "በጣም በደንብ":"Very well",
        "በጣም ብደንብ":"Very well",
        "በመጠኑ በደንብ":"Moderately well",
        "በመጠኑ በድንብ":"Moderately well",
        "በትንሹ በደንብ":"Slightly well",
        "በጭራሽ":"Not at all",
        "በጭራሽ ":"Not at all",

        "በጣም ምቹ":"Very comfortable",
        "በተወሰነ ደረጃ ምቹ":"Somewhat comfortable",
        "ገለልተኛ":"Neutral",
        "በተወሰነ ደረጃ የማይመች":"Somewhat uncomfortable",
        "በጣም የማይመች":"Very uncomfortable",

        "በጣም እስማማለሁ":"Strongly agree",
        "እስማማለሁ":"Agree",
        "ገለልተኛ":"Neutral",
        "አልስማማም":"Disagree",
        "አልስማማም":"Disagree",
        "በጣም አልስማማም":"Strongly disagree",

        "እጅግ በጣም ሊሆን የሚችል":"Extremely likely",
        "በጣም ሊሆን የሚችል":"Very likely",
        "በተወሰነ ደረጃ ሊሆን የሚችል":"Somewhat likely",
        "ያን ያህል ሊሆን የሚችል አይደለም":"Not so likely",
        "በጭራሽ ሊሆን የሚችል አይደለም":"Not at all likely",

        "በከፍተኛ ደረጃ":"To a great extent ",
        "በተወሰነ ደረጃ":"To some extent",
        "ገለልተኛ":"Neutral",
        "በትንሽ ደረጃ":"To a small extent",
        "በጭራሽ":"Not at all",

        "አዎ":"Yes",
        "አይ":"No",
        "እርግጠኛ አይደለሁም":"Not sure",

    }

    merged_df = df.replace(amharic_to_english_dict)
    merged_df = merged_df.dropna(how='all')

    merged_df = merged_df.map(lambda x: x.strip() if isinstance(x, str) else x)
    # Target list of correct department names
    target_values = [
        "Business-IFS",
        "Business",
        "CEO Office",
        "Finance",
        "HR & Admin",
        "MSP",
        "Product",
        "Technology",
        "Agency Network"
    ]

    def get_closest_match(value, choices, threshold=80):
        if isinstance(value, str) and value.strip():  # Check it's a non-empty string
            match, score = process.extractOne(value.strip(), choices)
            return match if score >= threshold else value
        return value  # Return original if not a string (e.g., NaN or number)


    merged_df.iloc[:, 1] = merged_df.iloc[:, 1].apply(lambda x: get_closest_match(x, target_values))


    return merged_df

def get_last_21(df):
    return df.iloc[:, -21:]

def is_similar(word, target="kifiya", threshold=85):
    return fuzz.ratio(word.lower(), target.lower()) >= threshold

def replace_similar(text, target="kifiya", replacement="the company", threshold=85):
    if not isinstance(text, str):
        return text
    words = re.findall(r'\b\w+\b', text)
    for word in words:
        if is_similar(word, target, threshold):
            text = re.sub(rf'\b{word}\b', replacement, text, flags=re.IGNORECASE)
    return text

def safe_replace_similar(x):
    try:
        return replace_similar(x)
    except Exception as e:
        print(f"Error processing value: {x} — {e}")
        return x


app = FastAPI(title="Survey Analysis API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "HR_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Authentication endpoints
@app.post("/auth/register", response_model=Token)
async def register(user_data: AdminUserCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin creates a new user"""
    try:
        user = create_user(user_data, db)
        return {"user": UserResponse.from_orm(user)}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/admin/create-user", response_model=UserResponse)
async def admin_create_user(user_data: AdminUserCreate, request: Request, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin creates a new user with role"""
    user = create_user(user_data, db)
    log_event(current_user.id, "admin_create_user", {"created_user": user.email, "role": user.role}, request.client.host)
    return UserResponse.from_orm(user)

@app.post("/auth/change-password")
async def change_password(current_password: str, new_password: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """User changes their own password"""
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(new_password)
    db.commit()
    return {"detail": "Password changed successfully"}

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db), request: Request = None):
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
    log_access(user.id, user.role, request.client.host if request else 'unknown', "login")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user),
    }

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@app.post("/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload and process survey data file"""
    global current_dataset, dataset_info

    try:
        file_path = f"./data/{file.filename}"
        print(file_path)
        base_name, extension = os.path.splitext(file.filename)
        print("base_name:", base_name)
        # Check if file already exists
        if os.path.exists(file_path):
            print("File already exists. Loading existing cleaned data...")
            df = pd.read_csv(f"./data/{base_name}.csv")
            current_dataset = df

            # Recreate dataset_info (minimal version)
            total_columns = len(df.columns)
            mc_columns = df.columns[:-3].tolist()
            text_columns = df.columns[-3:].tolist()

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

        # Else, process uploaded content
        contents = await file.read()
        dataframes = []

        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')), header=0)
            df = get_last_21(df)
            df.columns = English_headers
            dataframes.append(df)

        elif file.filename.endswith((".xlsx", ".xls")):
            xls = pd.ExcelFile(io.BytesIO(contents))
            for idx, sheet_name in enumerate(xls.sheet_names):
                if idx == 0:
                    df = xls.parse(sheet_name, header=0)
                else:
                    df = xls.parse(sheet_name, header=None, skiprows=1)
                df = get_last_21(df)
                df.columns = English_headers
                dataframes.append(df)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel files.")

        merged_df = pd.concat(dataframes, ignore_index=True)
        df = clean_df(merged_df)

        df.columns = [replace_similar(col) for col in df.columns]
        df = df.map(safe_replace_similar)
        df = clean_df(df)

        current_dataset = df

        # Extract metadata
        total_columns = len(df.columns)
        mc_columns = df.columns[:-3].tolist()
        text_columns = df.columns[-3:].tolist()

        # Translate text fields
        for col in text_columns:
            current_dataset[col] = await llm_analyzer.translator(current_dataset[col].fillna("").astype(str).tolist())

        # Save to disk
        df.to_csv(file_path, index=False)
        df.to_csv(f"./data/{base_name}.csv", index=False)

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

        log_event(current_user.id, "survey_upload", {"filename": file.filename}, request.client.host)

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

@app.get("/llm-analysis/{question_column}")
async def get_llm_analysis(question_column: str, current_user: User = Depends(get_current_user)):
    """Get LLM-powered analysis for a specific text question"""
    if current_dataset is None:
        raise HTTPException(status_code=404, detail="No dataset uploaded")
    
    try:
        df = current_dataset
        
        if question_column not in df.columns:
            raise HTTPException(status_code=400, detail="Question column not found in dataset")
        
        # Get text responses for the specified column
        text_data = df[question_column].dropna().astype(str).tolist()
        
        
        if len(text_data) == 0:
            raise HTTPException(status_code=400, detail="No text responses found for this question")
        
        # Run LLM analysis
        sentiment_analysis = await llm_analyzer.analyze_sentiment(text_data)
        theme_analysis = await llm_analyzer.extract_themes(text_data)
        emotion_analysis = await llm_analyzer.analyze_emotions(text_data)
        insights = await llm_analyzer.generate_insights(text_data, question_column)
        
        return {
            "question": question_column,
            "total_responses": len(text_data),
            "sentiment_analysis": sentiment_analysis,
            "theme_analysis": theme_analysis,
            "emotion_analysis": emotion_analysis,
            "insights": insights,
            "analysis_timestamp": pd.Timestamp.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in LLM analysis: {str(e)}")

@app.get("/llm-analysis-all")
async def get_llm_analysis_all(current_user: User = Depends(get_current_user)):
    """Get LLM analysis for all text questions"""
    if current_dataset is None:
        raise HTTPException(status_code=404, detail="No dataset uploaded")
    
    try:
        df = current_dataset
        text_columns = df.columns[-3:]
        
        results = {}
        
        for column in text_columns:
            text_data = df[column].dropna().astype(str).tolist()
            
            if len(text_data) > 0:
                
                # Run LLM analysis for each column
                
                sentiment_analysis = await llm_analyzer.analyze_sentiment(text_data)
                theme_analysis = await llm_analyzer.extract_themes(text_data)
                emotion_analysis = await llm_analyzer.analyze_emotions(text_data)
                insights = await llm_analyzer.generate_insights(text_data, column)
                
                results[column] = {
                    "question": column,
                    "total_responses": len(text_data),
                    "sentiment_analysis": sentiment_analysis,
                    "theme_analysis": theme_analysis,
                    "emotion_analysis": emotion_analysis,
                    "insights": insights
                }
            else:
                results[column] = {
                    "question": column,
                    "total_responses": 0,
                    "error": "No responses found"
                }
        
        return {
            "analysis": results,
            "summary": {
                "total_questions_analyzed": len([r for r in results.values() if "error" not in r]),
                "analysis_timestamp": pd.Timestamp.now().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in comprehensive LLM analysis: {str(e)}")

@app.get("/cross-tabulation/{question1}/{question2}")
async def get_cross_tabulation(question1: str, question2: str, current_user: User = Depends(get_current_user)):
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

@app.get("/admin/users", response_model=List[UserResponse])
async def list_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """List all users (admin only)"""
    users = db.query(User).all()
    return [UserResponse.from_orm(u) for u in users]

@app.post("/admin/reset-password")
async def admin_reset_password(email: str, new_password: str, request: Request, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin resets a user's password"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(new_password)
    db.commit()
    log_event(current_user.id, "admin_reset_password", {"reset_user": email}, request.client.host)
    return {"detail": "Password reset successfully"}

@app.delete("/admin/users/{user_id}")
async def delete_user(user_id: int, request: Request, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    log_event(current_user.id, "admin_delete_user", {"deleted_user_id": user_id}, request.client.host)
    return {"detail": "User deleted successfully"}

@app.post("/admin/users/{user_id}/deactivate")
async def deactivate_user(user_id: int, request: Request, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    log_event(current_user.id, "admin_deactivate_user", {"deactivated_user_id": user_id}, request.client.host)
    return {"detail": "User deactivated successfully"}

@app.post("/admin/users/{user_id}/activate")
async def activate_user(user_id: int, request: Request, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    log_event(current_user.id, "admin_activate_user", {"activated_user_id": user_id}, request.client.host)
    return {"detail": "User activated successfully"}

@app.put("/admin/users/{user_id}")
async def edit_user(user_id: int, request: Request, first_name: str = Body(...), last_name: str = Body(...), email: str = Body(...), role: str = Body(...), current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.first_name = first_name
    user.last_name = last_name
    user.email = email
    user.role = role
    db.commit()
    db.refresh(user)
    log_event(current_user.id, "admin_edit_user", {"edited_user": user.email, "role": user.role}, request.client.host)
    return {"detail": "User updated successfully", "user": UserResponse.from_orm(user)}

@app.get("/admin/audit/event-logs")
async def get_event_logs(current_user: User = Depends(require_admin), db: Session = Depends(get_db), user_id: int = None, event_type: str = None, ip: str = None, start: str = None, end: str = None):
    query = db.query(EventLog)
    if user_id:
        query = query.filter(EventLog.user_id == user_id)
    if event_type:
        query = query.filter(EventLog.event_type == event_type)
    if ip:
        query = query.filter(EventLog.ip_address == ip)
    if start:
        query = query.filter(EventLog.timestamp >= start)
    if end:
        query = query.filter(EventLog.timestamp <= end)
    logs = []
    for row in query.order_by(EventLog.timestamp.desc()).all():
        log = row.__dict__.copy()
        if log.get("timestamp"):
            log["timestamp"] = log["timestamp"].isoformat()
        logs.append(log)
    return logs

@app.get("/admin/audit/access-logs")
async def get_access_logs(current_user: User = Depends(require_admin), db: Session = Depends(get_db), user_id: int = None, role: str = None, ip: str = None, start: str = None, end: str = None):
    query = db.query(AccessLog)
    if user_id:
        query = query.filter(AccessLog.user_id == user_id)
    if role:
        query = query.filter(AccessLog.user_role == role)
    if ip:
        query = query.filter(AccessLog.ip_address == ip)
    if start:
        query = query.filter(AccessLog.accessed_at >= start)
    if end:
        query = query.filter(AccessLog.accessed_at <= end)
    logs = []
    for row in query.order_by(AccessLog.accessed_at.desc()).all():
        log = row.__dict__.copy()
        if log.get("accessed_at"):
            log["accessed_at"] = log["accessed_at"].isoformat()
        logs.append(log)
    return logs

@app.get("/dashboard")
async def dashboard(request: Request, current_user: User = Depends(get_current_user)):
    log_access(current_user.id, current_user.role, request.client.host, "view_dashboard")
    log_event(current_user.id, "view_dashboard", {"page": "dashboard"}, request.client.host)
    return {"message": "Dashboard"}

@app.get("/survey-dashboard")
async def survey_dashboard(request: Request, current_user: User = Depends(get_current_user)):
    log_access(current_user.id, current_user.role, request.client.host, "view_survey_dashboard")
    log_event(current_user.id, "view_survey_dashboard", {"page": "survey-dashboard"}, request.client.host)
    return {"message": "Survey Dashboard"}

@app.get("/admin")
async def admin_page(request: Request, current_user: User = Depends(require_admin)):
    log_access(current_user.id, current_user.role, request.client.host, "view_admin")
    return {"message": "Admin Page"}

@app.get("/admin/audit-logs")
async def audit_logs_page(request: Request, current_user: User = Depends(require_admin)):
    log_access(current_user.id, current_user.role, request.client.host, "view_audit_logs")
    return {"message": "Audit Logs Page"}

@app.get("/admin/users")
async def admin_users_page(request: Request, current_user: User = Depends(require_admin)):
    log_access(current_user.id, current_user.role, request.client.host, "view_user_management")
    return {"message": "User Management Page"}

@app.post("/auth/logout")
async def logout(request: Request, current_user: User = Depends(get_current_user)):
    log_access(current_user.id, current_user.role, request.client.host, "logout")
    log_event(current_user.id, "logout", {"action": "logout"}, request.client.host)
    return {"detail": "Logged out successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)