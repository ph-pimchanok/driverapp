import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { ApiResponse, Job } from '../types/api';

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ใส่ Endpoint String ตรงๆ
      const response = await axiosInstance.get<any, ApiResponse<Job[]>>(
        '/jobs/recent'
      );
      setJobs(response.data);

    } catch (err: any) {
      setError(err?.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. อัปเดตสถานะงาน
  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    try {

      const response = await axiosInstance.patch<any, ApiResponse<Job>>(`/jobs/${jobId}/status`,{ status });

      setJobs((prevJobs) =>
        prevJobs.map((job) => (job.id === jobId ? response.data : job))
      );

      return { success: true };

    } catch (err: any) {
      return {
        success: false,
        error: err?.response?.data?.message || 'อัปเดตไม่สำเร็จ',
      };
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refetchJobs: fetchJobs,
    updateJobStatus,
  };
};