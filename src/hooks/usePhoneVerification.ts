import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

interface VerificationStatus {
  isVerified: boolean;
  phoneNumber: string | null;
  needsVerification: boolean;
  verificationCount: number;
  lastVerifiedAt?: Date;
  nextVerificationRequired?: Date;
}

export function usePhoneVerification(redirectIfNeeded: boolean = true) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (isPending || !session?.user) {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('bearer_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/verification/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setVerificationStatus(data);

          // Redirect to verification page if needed
          if (redirectIfNeeded && data.needsVerification) {
            router.push('/verify-phone');
          }
        }
      } catch (error) {
        console.error('Failed to check verification status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkVerificationStatus();
  }, [session, isPending, redirectIfNeeded, router]);

  return {
    verificationStatus,
    isLoading,
    needsVerification: verificationStatus?.needsVerification ?? false,
    isVerified: verificationStatus?.isVerified ?? false
  };
}
