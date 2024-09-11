import { decryptData, digestMessage } from '$lib/common/encryption';
import type { Profile, ProfileData } from '$lib/common/interfaces';
import { isEncryptedData } from '$lib/common/misc';
import { getProfile, setMiscStore } from '$lib/common/stores';

export async function verify(id: string): Promise<Profile | undefined> {
  try {
    if (!id) {
      return undefined;
    }

    const profile = await getProfile();
    const digest = await digestMessage(id);

    if (!profile || !digest) {
      return undefined; // Don't set the store to anything here
    } else {
      if (isEncryptedData(profile.data)) {
        await decryptData(profile.data, digest).then(result => {
          profile.data = result as ProfileData;
          setMiscStore(digest);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        }, _reason => {
          // TODO: send reason to sentry but keep message generic
          throw 'Verification failed!';
        });
      }
      return profile;
    }
  } catch(e) {
    console.log(e);
    throw `Verification failed! - ${e}`;
  }
}
