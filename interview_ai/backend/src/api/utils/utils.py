import re
import html

def sanitizer(user_input: str) -> str:
    """
    Remove dangerous scripts, commands, and prompt-special tokens from user_input.

    Steps:
    1. Strip <script>…</script> blocks and other dangerous HTML tags.
    2. Remove shell metacharacters and common injection keywords.
    3. Strip out LLM prompt tokens like <|endoftext|>, <|prompt|>, >>>, etc.
    4. Escape any residual HTML-special characters.
    """
    clean = user_input

    clean = re.sub(r'(?i)<script\b[^>]*>.*?</script>', '', clean, flags=re.DOTALL)
    clean = re.sub(r'(?i)</?(?:iframe|object|embed|link|style|img|svg)\b[^>]*>', '', clean)

    for pattern in [
        r'[;&|`]',                             # shell metachars
        r'\b(?:rm|sudo|curl|chmod|chown)\b',  # dangerous CLI commands
        r'\b(?:import\s+os|subprocess)\b',    # Python system calls
    ]:
        clean = re.sub(pattern, '', clean, flags=re.IGNORECASE)

    clean = re.sub(r'<\|[^|]+\|>', '', clean)       # <|endoftext|>, <|prompt|>, etc.
    clean = re.sub(r'>>>+', '', clean)              # >>>, >>>>, etc.
    clean = re.sub(r'<<<+', '', clean)              # <<<, <<<<, etc.

    # 4. Escape any remaining HTML characters
    clean = html.escape(clean)

    return clean