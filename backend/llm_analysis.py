
import os
from typing import List, Dict, Any, Optional
import json
import re
from collections import Counter
import asyncio
from fastapi import HTTPException
import pandas as pd
from langchain_groq import ChatGroq
from groq import Groq
from dotenv import load_dotenv
import os
import os
import google.generativeai as genai

load_dotenv()

# Initialize Groq client
# Verify API key
if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY environment variable not set")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Set API key
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY environment variable not set")
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


class LLMAnalyzer:
    def __init__(self):
        self.model = "llama-3.1-8b-instant"  # or "gpt-4" for better results

    
        
    async def analyze_sentiment(self, texts: List[str]) -> Dict[str, Any]:
        """Analyze sentiment of text responses using LLM"""
        if not texts:
            return {"sentiments": [], "summary": {}}
            
        # Sample a subset for analysis if too many responses
        sample_texts = texts[:50] if len(texts) > 50 else texts
        
        prompt = f"""
        Analyze the sentiment of the following survey responses. For each response, classify the sentiment as:
        - Positive (score: 1)
        - Neutral (score: 0) 
        - Negative (score: -1)
        
        Also provide a confidence score from 0.0 to 1.0.
        
        Responses:
        {chr(10).join([f"{i+1}. {text}" for i, text in enumerate(sample_texts)])}
        
        Return your analysis in this exact JSON format:
        {{
            "sentiments": [
                {{"response_id": 1, "sentiment": "positive", "score": 1, "confidence": 0.85}},
                ...
            ],
            "overall_sentiment": "mixed",
            "positive_count": 0,
            "neutral_count": 0,
            "negative_count": 0
        }}
        """
        
        try:
            response = await self._call_llm(prompt)
            result = json.loads(response)            
            # Calculate statistics
            sentiments = result.get("sentiments", [])
            positive_count = sum(1 for s in sentiments if s["sentiment"].lower() == "positive")
            neutral_count = sum(1 for s in sentiments if s["sentiment"].lower() == "neutral")
            negative_count = sum(1 for s in sentiments if s["sentiment"].lower() == "negative")
            
            result.update({
                "positive_count": positive_count,
                "neutral_count": neutral_count,
                "negative_count": negative_count,
                "total_analyzed": len(sentiments)
            })
            
            return result
            
        except Exception as e:
            return self._fallback_sentiment_analysis(texts)
    
    async def extract_themes(self, texts: List[str]) -> Dict[str, Any]:
        """Extract main themes and topics from text responses"""
        if not texts:
            return {"themes": [], "summary": "No responses to analyze"}
            
        # Sample responses for theme extraction
        sample_texts = texts[:30] if len(texts) > 30 else texts
        
        prompt = f"""
        Analyze the following survey responses and identify the main themes, topics, and patterns.
        Extract 5-10 key themes that emerge from these responses.
        
        For each theme, provide:
        - Theme name
        - Description
        - Frequency (how often it appears)
        - Representative quotes
        
        Responses:
        {chr(10).join([f"{i+1}. {text}" for i, text in enumerate(sample_texts)])}
        
        Return your analysis in this exact JSON format:
        {{
            "themes": [
                {{
                    "name": "Theme Name",
                    "description": "Brief description",
                    "frequency": 15,
                    "percentage": 25.5,
                    "representative_quotes": ["quote 1", "quote 2"]
                }}
            ],
            "summary": "Overall summary of themes"
        }}
        """
        
        try:
            print(f"Input prompt for extract_themes (length: {len(prompt)} chars): {prompt[:500]}...")  # Log partial prompt
            response = await self._call_llm(prompt)
            print(f"Raw extract_themes response (length: {len(response)} chars): {response}")  # Log full response
            if not response.strip():
                return {"themes": [], "summary": "Empty response from LLM"}
            # Attempt to parse JSON, handling potential multiple JSON objects
            try:
                result = json.loads(response)
                return result
            except json.JSONDecodeError as e:
                print(f"JSON decode error in extract_themes: {str(e)}")
                # Try to extract the first valid JSON object if multiple are present
                try:
                    # Find the first complete JSON object
                    start = response.find('{')
                    end = response.rfind('}') + 1
                    if start != -1 and end != -1:
                        json_str = response[start:end]
                        result = json.loads(json_str)
                        print(f"Extracted valid JSON: {json_str}")
                        return result
                    else:
                        return {"themes": [], "summary": f"Could not extract valid JSON: {str(e)}"}
                except json.JSONDecodeError as e2:
                    print(f"Secondary JSON decode error: {str(e2)}")
                    return {"themes": [], "summary": f"Invalid JSON response from LLM: {str(e)}"}
        except Exception as e:
            print(f"Error in extract_themes: {str(e)}")
            return {"themes": [], "summary": f"Error extracting themes: {str(e)}"}
        
    async def analyze_emotions(self, texts: List[str]) -> Dict[str, Any]:
        """Analyze emotions in text responses"""
        if not texts:
            return {"emotions": {}, "summary": "No responses to analyze"}
            
        sample_texts = texts[:40] if len(texts) > 40 else texts
        
        prompt = f"""
        Analyze the emotional content of these survey responses. Identify the presence of these emotions:
        - Joy/Happiness
        - Sadness
        - Anger/Frustration
        - Fear/Anxiety
        - Surprise
        - Disgust
        - Trust/Confidence
        - Anticipation/Hope
        
        For each emotion, provide a count and percentage of responses that contain it.
        
        Responses:
        {chr(10).join([f"{i+1}. {text}" for i, text in enumerate(sample_texts)])}
        
        Return your analysis in this exact JSON format:
        {{
            "emotions": {{
                "joy": {{"count": 5, "percentage": 12.5}},
                "sadness": {{"count": 3, "percentage": 7.5}},
                "anger": {{"count": 8, "percentage": 20.0}},
                "fear": {{"count": 2, "percentage": 5.0}},
                "surprise": {{"count": 1, "percentage": 2.5}},
                "disgust": {{"count": 0, "percentage": 0.0}},
                "trust": {{"count": 10, "percentage": 25.0}},
                "anticipation": {{"count": 6, "percentage": 15.0}}
            }},
            "dominant_emotion": "trust",
            "total_analyzed": 40
        }}
        """
        
        try:
            response = await self._call_llm(prompt)
            print(response)
            return json.loads(response)
        except json.JSONDecodeError as e:
                print(f"JSON decode error in extract_emotions: {str(e)}")
                # Try to extract the first valid JSON object if multiple are present
                try:
                    # Find the first complete JSON object
                    start = response.find('{')
                    end = response.rfind('}') + 1
                    if start != -1 and end != -1:
                        json_str = response[start:end]
                        result = json.loads(json_str)
                        print(f"Extracted valid JSON: {json_str}")
                        return result
                    else:
                        return {"emotions": [], "summary": f"Could not extract valid JSON: {str(e)}"}
                except json.JSONDecodeError as e2:
                    print(f"Secondary JSON decode error: {str(e2)}")
                    return {"emotions": [], "summary": f"Invalid JSON response from LLM: {str(e)}"}
        except Exception as e:
            return {"emotions": {}, "summary": f"Error analyzing emotions: {str(e)}"}
    
    async def generate_insights(self, texts: List[str], question: str) -> Dict[str, Any]:
        """Generate actionable insights from responses"""
        if not texts:
            return {"insights": [], "recommendations": []}
            
        sample_texts = texts[:25] if len(texts) > 25 else texts
        
        prompt = f"""
        Analyze these survey responses for the question: "{question}"
        
        Provide:
        1. Key insights (3-5 main findings)
        2. Actionable recommendations (3-5 specific actions)
        3. Areas of concern (if any)
        4. Positive highlights
        
        Responses:
        {chr(10).join([f"{i+1}. {text}" for i, text in enumerate(sample_texts)])}
        
        Return your analysis in this exact JSON format:
        {{
            "insights": [
                "Key insight 1",
                "Key insight 2"
            ],
            "recommendations": [
                "Actionable recommendation 1",
                "Actionable recommendation 2"
            ],
            "concerns": [
                "Area of concern 1"
            ],
            "highlights": [
                "Positive highlight 1"
            ],
            "summary": "Overall summary of findings"
        }}
        """
        
        try:
            response = await self._call_llm(prompt)
            return json.loads(response)
        except json.JSONDecodeError as e:
                print(f"JSON decode error in extract_insights: {str(e)}")
                # Try to extract the first valid JSON object if multiple are present
                try:
                    # Find the first complete JSON object
                    start = response.find('{')
                    end = response.rfind('}') + 1
                    if start != -1 and end != -1:
                        json_str = response[start:end]
                        result = json.loads(json_str)
                        print(f"Extracted valid JSON: {json_str}")
                        return result
                    else:
                        return {"insights": [], "summary": f"Could not extract valid JSON: {str(e)}"}
                except json.JSONDecodeError as e2:
                    print(f"Secondary JSON decode error: {str(e2)}")
                    return {"insights": [], "summary": f"Invalid JSON response from LLM: {str(e)}"}
        except Exception as e:
            return {
                "insights": [f"Error generating insights: {str(e)}"],
                "recommendations": [],
                "concerns": [],
                "highlights": []
            }
    
    async def _call_llm(self, prompt: str) -> str:
        """Make API call to LLM"""
        try:
            '''
            messages=[
                    {"role": "system", "content": "You are an expert survey analyst. Provide accurate, detailed analysis in the requested JSON format."},
                    {"role": "user", "content": prompt}
                ]
            response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=8192
                )   
            '''
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction="You are an expert survey analyst. Provide accurate, detailed analysis in the requested JSON format."
                )  
            chat = model.start_chat(history=[])
            response = chat.send_message(prompt)    
            return response.text
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LLM API error: {str(e)}")
    
    def _fallback_sentiment_analysis(self, texts: List[str]) -> Dict[str, Any]:
        """Fallback sentiment analysis using simple keyword matching"""
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'satisfied']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'poor', 'worst']
        
        sentiments = []
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        
        for i, text in enumerate(texts):
            text_lower = text.lower()
            positive_score = sum(1 for word in positive_words if word in text_lower)
            negative_score = sum(1 for word in negative_words if word in text_lower)
            
            if positive_score > negative_score:
                sentiment = "positive"
                score = 1
                positive_count += 1
            elif negative_score > positive_score:
                sentiment = "negative"
                score = -1
                negative_count += 1
            else:
                sentiment = "neutral"
                score = 0
                neutral_count += 1
            
            sentiments.append({
                "response_id": i + 1,
                "sentiment": sentiment,
                "score": score,
                "confidence": 0.6  # Lower confidence for fallback method
            })
        
        return {
            "sentiments": sentiments,
            "positive_count": positive_count,
            "neutral_count": neutral_count,
            "negative_count": negative_count,
            "total_analyzed": len(texts),
            "method": "fallback"
        }

# Global analyzer instance
llm_analyzer = LLMAnalyzer()