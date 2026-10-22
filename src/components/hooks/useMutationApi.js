import {
  useMutation,
  useQueryClient,
} from "react-query";
import axiosInstance from "../../pages/shared/utils/axiosInstance.js";
import useUserStore from "../../pages/shared/store/user-store.js";
import toast from "react-hot-toast";

export const useMutationApi = ({
  keyToInvalidate,
  url,
  method = "post",
  config,
  options,
  showToast = true,
}) => {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const mutateData = async (params) => {
    const token = localStorage.getItem('access_token'); // Correct token key from auth service

    const requestConfig = {
      url,
      method,
      data: params,
      ...config,
    };

    // Add Authorization header if token exists
    if (token) {
      requestConfig.headers = {
        ...requestConfig.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    console.log('Mutation API Request Config:', requestConfig); // Debug log
    console.log('Token found:', !!token, 'Token value:', token?.substring(0, 20) + '...'); // Debug log

    const res = await axiosInstance(requestConfig);
    return res.data;
  };

  return useMutation({
    mutationFn: mutateData,
    onSuccess: (data, variables, context) => {
      if (showToast) toast.success("Success!");
      if (keyToInvalidate) queryClient.invalidateQueries(keyToInvalidate);
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (showToast) toast.error(error.message || "Something went wrong!");
      options?.onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      options?.onSettled?.(data, error, variables, context);
    },
    ...options,
  });
};
