import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';

// Initialize xAI client
const xaiClient = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
});

// Initialize OpenAI client
const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to create a file-like object from a buffer for the OpenAI SDK
function bufferToFile(buffer, filename) {
    return new File([buffer], filename, { type: 'image/png' });
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image');
        const selectedModel = formData.get('model') || 'grok'; // Default to grok if not specified

        if (!imageFile) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
        }

        // Check API keys based on selected model
        if (selectedModel === 'grok' && !process.env.XAI_API_KEY) {
            console.error('XAI_API_KEY environment variable not set.');
            return NextResponse.json({ error: 'Grok API key not configured on server.' }, { status: 500 });
        } else if (selectedModel === 'openai' && !process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY environment variable not set.');
            return NextResponse.json({ error: 'OpenAI API key not configured on server.' }, { status: 500 });
        }

        // Convert the image to base64 for the vision model (used by Grok)
        const imageArrayBuffer = await imageFile.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);
        
        // Process with the selected model
        if (selectedModel === 'grok') {
            return await processWithGrok(imageFile, imageBuffer);
        } else {
            return await processWithOpenAI(imageFile, imageBuffer);
        }

    } catch (error) {
        console.error('API Error or Internal Server Error:', error);
        // Provide more detail if it's an API specific error
        const errorMessage = error.response?.data?.error?.message || error.message || 'Internal server error processing image';
        const errorStatus = error.response?.status || 500;
        return NextResponse.json({ error: errorMessage }, { status: errorStatus });
    }
}

// Process image with Grok (xAI)
async function processWithGrok(imageFile, imageBuffer) {
    const imageBase64 = imageBuffer.toString('base64');
    const imageDataUrl = `data:${imageFile.type};base64,${imageBase64}`;

    console.log("Analyzing image content with Grok...");
    
    // Step 1: Analyze the image using the vision model
    const visionResponse = await xaiClient.chat.completions.create({
        model: "grok-2-vision-1212", // Using the vision model
        messages: [
            {
                role: "system",
                content: "You are an expert at describing images in detail. Restyle image in studio ghibli style, keep all details. Limit your description to 100 words maximum."
            },
            {
                role: "user",
                content: [
                    { type: "text", text: "Describe this image briefly. Focus on main subjects and style. Keep it under 100 words." },
                    { type: "image_url", image_url: { url: imageDataUrl } }
                ]
            }
        ],
        max_tokens: 150
    });

    const imageDescription = visionResponse.choices[0].message.content;
    console.log("Image description generated:", imageDescription);

    // Step 2: Create a Ghibli-style prompt based on the image description
    // Limit the description length if needed to avoid exceeding prompt limits
    const trimmedDescription = imageDescription.length > 300 
        ? imageDescription.substring(0, 300) + "..."
        : imageDescription;
        
    const ghibliPrompt = `Studio Ghibli style: ${trimmedDescription}. Vibrant colors, hand-drawn animation look, dreamlike quality.`;

    console.log("Generating Ghibli image with Grok...");
    
    // Step 3: Generate the Ghibli-style image based on the description
    const imageResponse = await xaiClient.images.generate({
        model: "grok-2-image",
        prompt: ghibliPrompt,
        n: 1,
        response_format: "url"
    });

    console.log("Grok image generation complete.");

    const imageUrl = imageResponse.data[0].url;

    if (!imageUrl) {
        throw new Error("Grok did not return an image URL.");
    }

    // Return both the URL and the description used
    return NextResponse.json({ 
        url: imageUrl,
        description: imageDescription,
        prompt: ghibliPrompt,
        model: 'grok'
    });
}

// Process image with OpenAI (DALL-E)
async function processWithOpenAI(imageFile, imageBuffer) {
    console.log("Processing with OpenAI DALL-E...");

    // Process the image with sharp to meet DALL-E requirements
    const processedImageBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, { fit: 'cover' }) // Ensure square, cover aspect ratio
        .png()
        .toBuffer();
    
    // Create a fully transparent PNG mask of the same size
    const transparentMaskBuffer = await sharp({ 
            create: { 
                width: 1024, 
                height: 1024, 
                channels: 4, // RGBA
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Fully transparent
            }
        })
        .png()
        .toBuffer();

    // Prepare the prompt for DALL-E
    const stylePrompt = 'Convert this image to Studio Ghibli style with vibrant colors, soft lighting, and hand-drawn animation look.';

    // Call OpenAI Image Edit API
    console.log("Calling OpenAI DALL-E...");
    const response = await openaiClient.images.edit({
        model: "dall-e-3",
        image: bufferToFile(processedImageBuffer, 'image.png'),
        mask: bufferToFile(transparentMaskBuffer, 'mask.png'),
        prompt: stylePrompt,
        n: 1,
        size: "1024x1024",
        response_format: "url",
    });

    console.log("OpenAI DALL-E generation complete.");

    const imageUrl = response.data[0].url;

    if (!imageUrl) {
        throw new Error("OpenAI did not return an image URL.");
    }

    // Return the URL and prompt
    return NextResponse.json({ 
        url: imageUrl,
        prompt: stylePrompt,
        model: 'openai'
    });
}
