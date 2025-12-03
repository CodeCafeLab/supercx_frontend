import { Request, Response } from "express";
import axios from "axios";
import { prisma, dbAvailable } from "../lib/prisma";

type WebhookPayload = {
  jobId: string;
  userId?: string;
  input: {
    modelImage?: string;
    modelPrompt?: string;
    apparelImage?: string;
    apparelPrompt?: string;
    scenePrompt?: string;
    negativePrompt?: string;
    numImages: number;
    aspectRatio?: string;
    imageQuality?: string;
    transparentBg?: boolean;
    upscale?: boolean;
    selectedScene?: any;
    selectedLighting?: any;
    selectedBackground?: any;
    selectedProps?: any[];
  };
  output: {
    imageUrls: string[];
    status: "pending" | "processing" | "completed" | "failed";
    error?: string;
  };
  metadata?: {
    createdAt: string;
    updatedAt?: string;
    processingTime?: number;
  };
};

/**
 * Create a webhook job for image generation
 * This endpoint receives all the input data and creates a job that will be processed by n8n
 */
export async function createWebhookJob(req: Request, res: Response) {
  try {
    const {
      modelImage,
      modelPrompt,
      apparelImage,
      apparelPrompt,
      scenePrompt,
      negativePrompt,
      numImages = 1,
      aspectRatio,
      imageQuality,
      transparentBg,
      upscale,
      selectedScene,
      selectedLighting,
      selectedBackground,
      selectedProps,
    } = req.body || {};

    const userId = (req as any).userId;

    // Generate a unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Prepare the webhook payload
    const webhookPayload: WebhookPayload = {
      jobId,
      userId: userId || undefined,
      input: {
        modelImage,
        modelPrompt,
        apparelImage,
        apparelPrompt,
        scenePrompt,
        negativePrompt,
        numImages: parseInt(numImages) || 1,
        aspectRatio,
        imageQuality,
        transparentBg: Boolean(transparentBg),
        upscale: Boolean(upscale),
        selectedScene,
        selectedLighting,
        selectedBackground,
        selectedProps: Array.isArray(selectedProps) ? selectedProps : [],
      },
      output: {
        imageUrls: [],
        status: "pending",
      },
      metadata: {
        createdAt: new Date().toISOString(),
      },
    };

    // Save job to database if available
    if (dbAvailable) {
      try {
        await (prisma as any).generation_jobs.create({
          data: {
            id: jobId,
            user_id: userId || undefined,
            job_type: "virtual_shoot",
            status: "pending",
            prompt: scenePrompt || "Image generation",
            input_assets: webhookPayload.input,
            num_outputs: webhookPayload.input.numImages,
          },
        });
      } catch (error) {
        console.error("Error saving job to database:", error);
        // Continue even if database save fails
      }
    }

    // Send webhook payload to n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        // Send to n8n asynchronously (don't wait for response)
        axios.post(n8nWebhookUrl, webhookPayload, {
          timeout: 5000,
          headers: {
            "Content-Type": "application/json",
          },
        }).catch((error) => {
          // Log error but don't fail the request
          console.error("Error sending to n8n webhook:", error.message);
        });
      } catch (error) {
        console.error("Error preparing n8n webhook request:", error);
      }
    } else {
      console.warn("N8N_WEBHOOK_URL not set. Webhook payload not sent to n8n.");
    }

    // Return success response
    return res.status(201).json({
      success: true,
      jobId,
      webhookPayload,
      message: n8nWebhookUrl 
        ? "Job created and sent to n8n webhook successfully." 
        : "Job created successfully. N8N_WEBHOOK_URL not configured.",
      webhookUrl: n8nWebhookUrl || "NOT_CONFIGURED",
    });
  } catch (error) {
    console.error("Error creating webhook job:", error);
    return res.status(500).json({
      error: "internal_server_error",
      message: "Failed to create webhook job",
    });
  }
}

/**
 * Update webhook job status (called by n8n after processing)
 */
export async function updateWebhookJob(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    const { status, imageUrls, error } = req.body || {};

    if (!jobId) {
      return res.status(400).json({ error: "invalid_input", message: "Job ID is required" });
    }

    if (!dbAvailable) {
      return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
    }

    // Update job in database
    const updateData: any = {
      status: status || "completed",
      updated_at: new Date(),
    };

    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      updateData.input_assets = {
        ...updateData.input_assets,
        generatedImages: imageUrls,
      };
    }

    if (error) {
      updateData.input_assets = {
        ...updateData.input_assets,
        error,
      };
    }

    await (prisma as any).generation_jobs.update({
      where: { id: jobId },
      data: updateData,
    });

    // Create generation outputs if images are provided
    if (imageUrls && Array.isArray(imageUrls)) {
      for (const imageUrl of imageUrls) {
        await (prisma as any).generation_outputs.create({
          data: {
            job_id: jobId,
            image_url: imageUrl,
            metadata: {
              generatedAt: new Date().toISOString(),
            },
          },
        });
      }
    }

    return res.json({
      success: true,
      jobId,
      message: "Job updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating webhook job:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "not_found", message: "Job not found" });
    }
    return res.status(500).json({
      error: "internal_server_error",
      message: "Failed to update webhook job",
    });
  }
}

/**
 * Get webhook job status
 */
export async function getWebhookJobStatus(req: Request, res: Response) {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({ error: "invalid_input", message: "Job ID is required" });
    }

    if (!dbAvailable) {
      return res.status(503).json({ error: "database_unavailable", message: "Database is not available" });
    }

    const job = await (prisma as any).generation_jobs.findUnique({
      where: { id: jobId },
      include: {
        outputs: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: "not_found", message: "Job not found" });
    }

    return res.json({
      jobId: job.id,
      status: job.status,
      imageUrls: job.outputs?.map((output: any) => output.image_url) || [],
      createdAt: job.created_at,
      completedAt: job.completed_at,
    });
  } catch (error) {
    console.error("Error getting webhook job status:", error);
    return res.status(500).json({
      error: "internal_server_error",
      message: "Failed to get job status",
    });
  }
}

