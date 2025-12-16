import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

const s3Client = new S3Client({
    region: process.env.STORAGE_REGION || "auto",
    endpoint: process.env.STORAGE_ENDPOINT,
    credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    },
});

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;

        const command = new PutObjectCommand({
            Bucket: process.env.STORAGE_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
            // ACL: "public-read", // Uncomment if bucket is public, or manage via bucket policy
        });

        await s3Client.send(command);

        // Construct public URL (adjust based on your Backblaze B2 settings)
        // For Backblaze, it's usually https://<bucketName>.<endpoint>/<fileName> or similar
        // BUT the endpoint provided is s3.us-east-005.backblazeb2.com.
        // Public URL format for B2 is often: https://<bucket-name>.s3.<region>.backblazeb2.com/<file-key>
        // OR if using the friendly URL: https://f005.backblazeb2.com/file/<bucket-name>/<file-key>
        // Let's try to construct a standard S3 style URL first.
        const url = `${process.env.STORAGE_ENDPOINT}/${process.env.STORAGE_BUCKET_NAME}/${fileName}`;

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Error uploading to S3:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
