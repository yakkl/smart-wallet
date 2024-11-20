export interface GasSponsor {
  isEligibleForSponsorship( userAddress: string ): Promise<boolean>;
  getSponsorshipAmount( userAddress: string, gasCost: bigint ): Promise<bigint>;
}
