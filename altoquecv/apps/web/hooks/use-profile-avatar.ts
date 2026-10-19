import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProfileAvatar, saveProfileAvatar } from '@/lib/profile-avatar-storage';

export function useProfileAvatar(ownerId: string) {
  const [avatarUrl, setAvatarUrl] = useState('');
  const currentUrl = useRef('');

  useEffect(() => {
    let disposed = false;

    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = '';
    setAvatarUrl('');
    const refreshAvatar = () => {
      loadProfileAvatar(ownerId)
        .then((avatar) => {
          if (avatar && !disposed) {
            if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
            currentUrl.current = URL.createObjectURL(avatar.blob);
            setAvatarUrl(currentUrl.current);
          }
        })
        .catch((error: unknown) => {
          console.error('No se pudo cargar la foto de perfil:', error);
        });
    };
    const handleAvatarUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ ownerId: string }>).detail;
      if (detail?.ownerId === ownerId) refreshAvatar();
    };

    refreshAvatar();
    window.addEventListener('altoquecv-profile-avatar-updated', handleAvatarUpdate);
    return () => {
      disposed = true;
      window.removeEventListener('altoquecv-profile-avatar-updated', handleAvatarUpdate);
    };
  }, [ownerId]);

  const updateAvatar = useCallback(async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Elige una imagen JPG, PNG o WebP.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen no puede superar los 5 MB.');
    }

    await saveProfileAvatar(ownerId, file);
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = URL.createObjectURL(file);
    setAvatarUrl(currentUrl.current);
    window.dispatchEvent(new CustomEvent('altoquecv-profile-avatar-updated', { detail: { ownerId } }));
  }, [ownerId]);

  useEffect(() => () => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
  }, []);

  return { avatarUrl, updateAvatar };
}
