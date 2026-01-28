/**
 * Web mock for react-native-document-picker
 * Uses the HTML file input element for file selection
 */

export interface DocumentPickerResponse {
  uri: string;
  fileCopyUri?: string;
  name: string;
  type: string;
  size: number;
}

export const types = {
  allFiles: '*/*',
  images: 'image/*',
  plainText: 'text/plain',
  audio: 'audio/*',
  video: 'video/*',
  pdf: 'application/pdf',
  // EPUB types
  epub: 'application/epub+zip,.epub',
};

export interface PickOptions {
  type?: string | string[];
  allowMultiSelection?: boolean;
  copyTo?: 'cachesDirectory' | 'documentDirectory';
}

export const pick = async (options?: PickOptions): Promise<DocumentPickerResponse[]> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = options?.allowMultiSelection ?? false;

    if (options?.type) {
      const typeList = Array.isArray(options.type) ? options.type : [options.type];
      // Map types to accept values
      const acceptValues = typeList.map(t => {
        // Handle our custom epub type
        if (t === types.epub) return '.epub,application/epub+zip';
        return t;
      });
      input.accept = acceptValues.join(',');
    }

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        reject(new Error('User cancelled document picker'));
        return;
      }

      try {
        const results: DocumentPickerResponse[] = await Promise.all(
          Array.from(files).map(async (file) => {
            // Create a blob URL for the file
            const blobUrl = URL.createObjectURL(file);

            return {
              uri: blobUrl,
              fileCopyUri: blobUrl, // Same as uri for web - the blob URL works with fetch
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: file.size,
            };
          })
        );

        resolve(results);
      } catch (error) {
        reject(error);
      }
    };

    input.oncancel = () => {
      reject(new Error('User cancelled document picker'));
    };

    // Handle click away / cancel (not all browsers support oncancel)
    const handleFocus = () => {
      // Delay to allow onchange to fire first if file was selected
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          window.removeEventListener('focus', handleFocus);
          // Don't reject - the onchange will handle it
        }
      }, 300);
    };
    window.addEventListener('focus', handleFocus, {once: true});

    input.click();
  });
};

export const pickSingle = async (options?: PickOptions): Promise<DocumentPickerResponse> => {
  const results = await pick({...options, allowMultiSelection: false});
  return results[0];
};

export const isCancel = (err: unknown): boolean => {
  return (
    err instanceof Error && err.message.includes('User cancelled document picker')
  );
};

export default {
  types,
  pick,
  pickSingle,
  isCancel,
};
