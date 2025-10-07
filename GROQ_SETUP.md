# Groq AI Integration Setup

This project now includes Groq AI integration for enhanced conversational AI capabilities in the TenJin mental health chatbot.

## Setup Instructions

### 1. Install Dependencies

First, install the required dependencies:

```bash
npm install
```

The `groq-sdk` package has been added to the dependencies in `package.json`.

### 2. Get Groq API Key

1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up or log in to your account
3. Create a new API key
4. Copy the API key (it starts with `gsk_`)

### 3. Configure Environment Variables

1. Create a `.env.local` file in the root directory:

```bash
# Create the environment file
touch .env.local
```

2. Add your Groq API key to `.env.local`:

```env
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
```

Replace `your_groq_api_key_here` with your actual Groq API key.

**Note**: The `NEXT_PUBLIC_` prefix is required for client-side usage in Next.js.

### 4. Features

The Groq integration provides:

- **Context-aware responses**: Uses emotion detection and mental health assessment data
- **Conversation memory**: Maintains conversation history for better context
- **Fallback responses**: Graceful degradation when API is unavailable
- **Indonesian language support**: Optimized for Indonesian mental health conversations
- **Professional counseling tone**: Configured to act as an empathetic AI counselor

### 5. Usage

The integration is automatically active in both pages:
- **CeritaTenjin page** (`/ceritatenjin`) - Text-based chat with emotion detection
- **SuaraTenjin page** (`/suaratenjin`) - Voice-based chat with speech recognition

The AI will:

1. Analyze user emotions through facial detection
2. Consider mental health indicators
3. Generate contextually appropriate responses using Groq's Llama 3.3 70B model
4. Provide empathetic and supportive conversation

### 6. Model Information

- **Model**: `llama-3.3-70b-versatile`
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 500 (concise responses)
- **Language**: Optimized for Indonesian

### 7. Error Handling

If the Groq API is unavailable or misconfigured, the system will:
- Fall back to predefined emotion-based responses
- Log errors to the console
- Continue functioning without interruption

### 8. Security Notes

- API keys are handled client-side for this demo
- For production, consider server-side API calls
- Never commit `.env.local` to version control
- The `.env.example` file shows the required format

## Troubleshooting

### API Key Issues
- Ensure your API key is valid and active
- Check that the environment variable is correctly named
- Restart the development server after adding environment variables

### Network Issues
- Check your internet connection
- Verify Groq service status
- Review browser console for error messages

### Model Responses
- The AI is configured for mental health support
- Responses are limited to 500 tokens for readability
- Context includes emotion and mental health data when available
