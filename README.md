# Ghibli Image Generator

A web application that transforms your images into Studio Ghibli-inspired artwork using AI. This project leverages both xAI's Grok and OpenAI's DALL-E models to analyze uploaded images and generate beautiful Ghibli-style renditions.

![Ghibli Image Generator Screenshot](https://i.imgur.com/example.png)

## Features

- **Image Analysis**: Analyzes uploaded images to understand their content and composition
- **Ghibli-Style Generation**: Transforms images into the iconic Studio Ghibli art style
- **Multiple AI Models**: Choose between xAI's Grok or OpenAI's DALL-E for image generation
- **Transparent Process**: View the AI's description of your image and the prompt used for generation
- **Modern UI**: Beautiful, responsive interface with drag-and-drop functionality
- **Real-time Feedback**: See the generation process with loading indicators and error handling

## How It Works

The application uses a two-step AI process:

1. **Image Analysis** (Grok only): When using the Grok model, your uploaded image is analyzed by the Grok Vision model to generate a detailed description of its content.

2. **Style Transfer**:
   - **Grok**: Uses the image description to create a specialized prompt for the Grok image generation model, which creates a new image in Ghibli style based on your uploaded content.
   - **DALL-E**: Uses OpenAI's image editing capabilities to directly apply Ghibli-style characteristics to your uploaded image.

## Technologies Used

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI APIs**: 
  - xAI (Grok) for image analysis and generation
  - OpenAI (DALL-E) for image editing
- **Image Processing**: Sharp for image resizing and format conversion

## Setup

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- xAI API key (for Grok model)
- OpenAI API key (for DALL-E model)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ghibli-image-generator.git
   cd ghibli-image-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your API keys:
   ```
   XAI_API_KEY=your_xai_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## Usage

1. Upload an image by dragging and dropping or using the file browser
2. Select your preferred AI model (Grok or DALL-E)
3. Click "Generate Ghibli Image"
4. View the generated image along with the description and prompt used (when using Grok)

## API Reference

### `/api/stylize` Endpoint

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `image`: Image file
  - `model`: "grok" or "openai"

**Response**:
- Status: 200 OK
- Content-Type: application/json
- Body:
  - `url`: URL of the generated image
  - `description`: Description of the uploaded image (Grok only)
  - `prompt`: Prompt used for generation
  - `model`: Model used for generation

## Limitations

- The Grok model has a maximum prompt length of 1024 characters
- The DALL-E model requires images to be resized to 1024x1024 pixels
- The application requires valid API keys for both services to offer full functionality

## Future Improvements

- Add more style options beyond Studio Ghibli
- Implement image history to view and download past generations
- Add user accounts to save favorite generations
- Optimize for mobile devices
- Add more customization options for the generation process

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Studio Ghibli for their iconic art style that inspired this project
- xAI and OpenAI for their powerful image generation APIs
- Next.js team for the excellent framework

---

This project was bootstrapped with [Create Next App](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
