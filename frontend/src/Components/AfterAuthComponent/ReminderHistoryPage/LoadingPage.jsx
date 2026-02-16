import { Loader2 } from "lucide-react";

const LoadingPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      {/* Spinner */}
      <Loader2 className="h-12 w-12 animate-spin text-green-600" />

      {/* Optional text */}
      {/* <p className="text-gray-500 text-sm">Loading, please wait...</p> */}
    </div>
  );
};

export default LoadingPage;
