declare module "cloudinary" {
  export const v2: {
    config(options: {
      cloud_name?: string;
      api_key?: string;
      api_secret?: string;
    }): void;
    uploader: {
      destroy(publicId: string): Promise<{ result: string }>;
    };
  };
}
