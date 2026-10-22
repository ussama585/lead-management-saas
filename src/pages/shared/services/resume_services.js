import api from "./api.js";

export const requestResumeUpload = async (filesPayload) => {
  const { data } = await api.post(
    "/resumes/public-request-upload",
    filesPayload,
  );
  return data;
};

export const completeResumeUpload = async (resumes) => {
  const { data } = await api.post("/resumes/public-complete-upload", {
    resumes,
  });
  return data;
};


