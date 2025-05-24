import { createClient } from "@supabase/supabase-js";

export async function getProfileImageLink(base64String: string) {
  try {
    if (
      !process.env.SUPABASE_URL ||
      !process.env.SERVICE_KEY ||
      !process.env.BUCKET_NAME
    ) {
      throw new Error("Supabase url, service key and bucket name are required");
    }
    const imageUrl = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!imageUrl) {
      throw new Error("Invalid image format");
    }
    const contentType = imageUrl[1];
    const base64Data = imageUrl[2];
    const buffer = Buffer.from(base64Data, "base64");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SERVICE_KEY
    );
    const fileName = `image-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from(process.env.BUCKET_NAME)
      .upload(`images/${fileName}`, buffer, {
        contentType: contentType,
      });
    if(error){
      throw new Error(`${error}`)
    }
    const { data: publicUrlData } = supabase.storage
      .from(process.env.BUCKET_NAME)
      .getPublicUrl(`images/${fileName}`);
    const profileUrl = publicUrlData.publicUrl;
    return profileUrl;
  } catch (error) {
    throw new Error(`Error uploading the image to bucket: ${(error as Error).message}`);
  }
}
