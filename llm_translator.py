  async def translator(self, texts: List[str]) -> List[str]:
        system_prompt = """
        You are a professional translator specializing in Amharic-to-English translation.

        You will be given a list of text responses. Some of the responses are in Amharic and some are already in English.

        For each item in the list:
        - If the text is in Amharic, translate it into clear, fluent English, preserving the tone, meaning, and context as much as possible.
        - If the text is already in English, leave it unchanged.
        - Return the final list with all translations in the same order as the original.

        Do not include explanations, language tags, or notes—just return the translated or original text as a clean list.
        Be accurate, culturally sensitive, and natural in tone.
        """

        model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_prompt
                )  
                # Function to split into batches
        def batch_list(lst, batch_size):
            for i in range(0, len(lst), batch_size):
                yield lst[i:i + batch_size]

        # Translate in batches
        translated_all = []

        for batch in batch_list(texts, 20):  # Adjust batch size if needed
            prompt = system_prompt + "\n\n" + f"Input:\n{batch}"
            response = model.generate_content(prompt)
            
            translated_batch = eval(response.text.strip())  # Assumes clean list output
            translated_all.extend(translated_batch)
            time.sleep(2)  # Respectful throttling


        # Print or store the final translated list
        for original, translated in zip(texts, translated_all):
            print(f"Original: {original}\nTranslated: {translated}\n")
        return translated_all

        