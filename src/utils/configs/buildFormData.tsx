export function buildFormData(
  values: Record<string, any>,
  fileList: any[] = []
) {
  const formData = new FormData();

  // append tất cả field text/number từ object
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value as any);
    }
  });

  // append file (nếu có)
  fileList.forEach((file) => {
    // Nếu dùng Ant Design Upload -> file.originFileObj mới là file gốc
    const realFile = file.originFileObj || file;
    formData.append("UploadedFile", realFile); // trùng với property backend
  });

  return formData;
}
