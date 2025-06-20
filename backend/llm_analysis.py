
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
import time
import google.generativeai as genai

load_dotenv()

# Initialize Groq client
# Verify API key
if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY environment variable not set")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Set API key
if not os.getenv("GOOGLE_API_KEY2"):
    raise ValueError("GOOGLE_API_KEY environment variable not set")
genai.configure(api_key=os.getenv("GOOGLE_API_KEY2"))

def clean_llm_output(text):
                text = remove_markdown_code_block(text)
                text = clean_quotes(text)
                return text

def remove_markdown_code_block(text: str) -> str:
    return re.sub(r"^```.*?\n|```$", "", text.strip(), flags=re.DOTALL)

def clean_quotes(text):
    return re.sub(r"[‘’]", "'", re.sub(r"[“”]", '"', text))


class LLMAnalyzer:
    def __init__(self):
        self.model = "llama-3.1-8b-instant"  # or "gpt-4" for better results
        """
        Initializes the Translator with the given API key and configures
        the GenerativeModel with a specific system instruction.

        Args:
            api_key (str): Your Google Gemini API key.
        """
        api_key = os.getenv("GOOGLE_API_KEY2")
        if not api_key:
            raise ValueError("API key cannot be empty. Please provide a valid Gemini API key.")
        
        genai.configure(api_key=api_key)
        
        self.model2 = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            # The system_instruction is crucial for defining the model's role and expected output format.
            system_instruction="""
            You are a professional translator specializing in Amharic-to-English translation.

            You will be given a list of text responses as a Python-list-like string.
            For example: "Input: ['sentence1', 'sentence2', 'sentence3']".
            Some of the responses in the input list are in Amharic, and some are already in English.

            Your task is to process each item in the input list:
            - If the text is in Amharic, translate it into clear, fluent English, preserving the tone, meaning, and context as much as possible.
            - If the text is already in English, leave it unchanged.
            
            Your entire output MUST be a single, valid JSON array of strings.
            The array should contain the translated or original responses, in the exact same order as the input.
            Do NOT include any extra text, explanations, language tags, markdown formatting (like ```json), or notes outside the JSON array.

            Example:
            Input: ['ሰላም', 'Hello', 'እንዴት ነህ?']
            Output: ["Hello", "Hello", "How are you?"]

            Be accurate, culturally sensitive, and natural in tone.
            """
        )
    
    async def translator(self, texts: List[str]) -> List[str]:
        """
        Translates a list of sentences, identifying and translating only Amharic sentences
        to English using batch processing.

        Args:
            texts (List[str]): A list of sentences, potentially containing a mix of
                               English and Amharic.

        Returns:
            List[str]: A new list containing the translated (if Amharic) or
                       original (if English) sentences.
        
        Raises:
            json.JSONDecodeError: If the model's output is not a valid JSON array.
            Exception: For any other unexpected errors during the API call.
        """
        if not texts:
            return []

        # Function to split into batches
        def batch_list(lst: List[str], batch_size: int):
            """Yields successive n-sized chunks from lst."""
            for i in range(0, len(lst), batch_size):
                yield lst[i:i + batch_size]

        translated_all = []
        batch_size = 20  # Recommended batch size, adjust if needed based on token limits and latency

        for i, batch in enumerate(batch_list(texts, batch_size)):
            print(f"Processing batch {i+1} of {len(texts) // batch_size + (1 if len(texts) % batch_size > 0 else 0)}...")
            
            # CRITICAL CORRECTION:
            # The prompt sent to generate_content_async must be a simple string.
            # We convert the Python list 'batch' into its string representation,
            # which matches the format described in the system_instruction.
            prompt_content = f"Input: {str(batch)}"

            try:
                # Use generate_content_async for non-blocking I/O
                response = await self.model2.generate_content_async(
                    prompt_content,
                    generation_config=genai.types.GenerationConfig(
                        # This setting is crucial for forcing the model to output a valid JSON string.
                        response_mime_type="application/json" 
                    )
                )
                
                raw_output = response.text.strip()
                
                # Attempt to parse the raw string output as a JSON array
                translated_batch = json.loads(raw_output)
                
                # Basic validation: Check if the number of translated items matches the input batch size
                if len(translated_batch) != len(batch):
                    print(f"Warning: Batch {i+1} output length mismatch. Expected {len(batch)}, got {len(translated_batch)}. "
                          f"Raw output: {raw_output}")

                translated_all.extend(translated_batch)
                
                # Introduce a small delay to respect API rate limits and avoid overwhelming the service.
                # Use asyncio.sleep in an async function to avoid blocking the event loop.
                await asyncio.sleep(1) # Reduced sleep slightly, adjust based on your quota
                
            except json.JSONDecodeError as e:
                print(f"ERROR: JSON Decoding Error in batch {i+1}: {e}")
                raise
            except Exception as e:
                print(f"ERROR: An unexpected error occurred in batch {i+1}: {e}")
             
                # Re-raise for general API or network issues
                raise            
        
        return translated_all
    
   
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
            response = clean_llm_output(response)
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
            response = await self._call_llm(prompt)
            response = clean_llm_output(response)
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
        response = await self._call_llm(prompt)
        try:
            
            response = clean_llm_output(response)
            
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
            
        sample_texts = texts[:50] if len(texts) > 50 else texts
        
        prompt = f"""
        Analyze these survey responses for the question: "{question}"
        
        Provide:
        1. Key insights (4-6 main findings)
        2. Actionable recommendations (4-6 specific actions)
        3. Areas of concern with explicit complaints (clear, direct expressions of dissatisfaction or frustration)(4-6 specific concerns)
        4. Positive highlights (4-6 specific highlights)
        
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
        response = await self._call_llm(prompt)
        try:
            
            response = clean_llm_output(response)
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
            
            messages=[
                    {"role": "system", "content": "You are an expert survey analyst. Provide accurate, detailed analysis in the requested JSON format."},
                    {"role": "user", "content": prompt}
                ]
            completion = client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=8192
                )   
            
            response = completion.choices[0].message.content
            return response
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