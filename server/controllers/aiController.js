import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  try {
    const userId = req.userId;
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-flash-latest",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;

    // Try to save to database (non-blocking)
    try {
      console.log("Attempting database insert for userId:", userId);
      const result =
        await sql`INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article') RETURNING *`;
      console.log("Database insert successful:", result);
    } catch (dbError) {
      console.log("Database insert failed (non-critical):", dbError.message);
    }

    // Try to update usage counter (non-blocking)
    if (plan !== "premium") {
      try {
        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: {
            free_usage: free_usage + 1,
          },
        });
      } catch (clerkError) {
        console.log("Clerk update failed (non-critical):", clerkError.message);
      }
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log("❌ Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const userId = req.userId;
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-flash-latest",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;

    // Update usage counter
    if (plan !== "premium") {
      try {
        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: {
            free_usage: free_usage + 1,
          },
        });
      } catch (clerkError) {
        console.log("Clerk update failed (non-critical):", clerkError.message);
      }
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log("❌ Error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const userId = req.userId;
    const { prompt } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    const form = new FormData();
    form.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      form,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API_KEY,
          ...form.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    // Save to database
    try {
      await sql`INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, ${prompt}, ${secure_url}, 'image')`;
    } catch (dbError) {
      console.log("Database save failed (non-critical):", dbError.message);
    }

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log("❌ Image generation error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const userId = req.userId;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    // Try to save to database (non-blocking)
    try {
      await sql`INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, 'Remove the background from image', ${secure_url}, 'image')`;
    } catch (dbError) {
      console.log("Database save failed (non-critical):", dbError.message);
    }

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const userId = req.userId;
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    console.log("🔧 Remove object request:", {
      userId,
      object,
      imagePath: image?.path,
      imageSize: image?.size,
      plan,
    });

    if (plan !== "premium") {
      console.log("❌ User is not premium");
      return res.json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    console.log("☁️ Uploading to Cloudinary...");
    const { public_id } = await cloudinary.uploader.upload(image.path);
    console.log("✅ Upload successful, public_id:", public_id);

    console.log("🎨 Applying transformation to remove:", object);
    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: "image",
    });
    console.log("✅ Transformed image URL:", imageUrl);

    // Try to save to database (non-blocking)
    try {
      await sql`INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;
      console.log("✅ Database save successful");
    } catch (dbError) {
      console.log("Database save failed (non-critical):", dbError.message);
    }

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.log("❌ Remove object error:", error.message);
    console.log("❌ Error stack:", error.stack);
    res.json({ success: false, message: error.message });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const userId = req.userId;
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds allowed size (5MB).",
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);

    // Dynamic import for pdf-parse (PDFParse is a class)
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({
      data: dataBuffer,
    });
    await parser.load();
    const text = await parser.getText();

    const prompt = `Review the following resume and provide constructive 
    feedback on its strengths, weaknesses, and areas for improvement. Resume
    Content:\n\n${text}`;

    const response = await AI.chat.completions.create({
      model: "gemini-flash-latest",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;

    // Try to save to database (non-blocking)
    try {
      await sql`INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;
    } catch (dbError) {
      console.log("Database save failed (non-critical):", dbError.message);
    }

    res.json({ success: true, content });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
