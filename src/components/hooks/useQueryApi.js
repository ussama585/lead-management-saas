import { useQuery } from "react-query";
import axiosInstance from "../../pages/shared/utils/axiosInstance.js";
import useUserStore from "../../pages/shared/store/user-store.js";

// Default query configuration for all API calls
const DEFAULT_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
};

export const useQueryApi = ({
  key,
  url,
  enabled = true,
  config,
  params,
  options,
}) => {
  const { user } = useUserStore();

  const fetchData = async () => {
    const token = localStorage.getItem('access_token');

    const requestConfig = {
      url,
      method: "get",
      params,
      ...config,
    };

    // Add Authorization header if token exists
    if (token) {
      requestConfig.headers = {
        ...requestConfig.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const res = await axiosInstance(requestConfig);
    return res.data;
  };

  const queryResult = useQuery({
    queryKey: [...key, params],
    queryFn: fetchData,
    enabled,
    ...DEFAULT_QUERY_CONFIG,
    ...options,
  });

  return queryResult;
};
