import { cloudinaryConfig } from "./cloudinaryConfig.js";

export const uploadSingleFile = async ({ path, folder = "others" }) => {
  const { public_id, secure_url } = await cloudinaryConfig().uploader.upload(
    path,
    {
      folder: `${process.env.APP_NAME}/${folder}/`,
    }
  );
  return { public_id, secure_url };
};

export const destroyFile = async (public_id) => {
  await cloudinaryConfig().uploader.destroy(public_id);
};

export const deleteFolderResources = async (prefix) => {
  await cloudinaryConfig().api.delete_resources_by_prefix(
    `${process.env.APP_NAME}/${prefix}/`
  );
};

export const deleteFolder = async (folder) => {
  await cloudinaryConfig().api.delete_folder(
    `${process.env.APP_NAME}/${folder}/`,
    console.log
  );
};

export const uploadMultipleFiles = async ({ paths = [], dest }) => {
  const images = [];

  for (const path of paths) {
    const { public_id, secure_url } = await uploadSingleFile({
      path,
      folder: dest,
    });
    images.push({ public_id, secure_url });
  }

  return images;
};
