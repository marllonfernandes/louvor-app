export const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600 shadow-blue-500/20',
  'from-violet-500 to-purple-600 shadow-purple-500/20',
  'from-emerald-500 to-teal-600 shadow-emerald-500/20',
  'from-amber-500 to-orange-600 shadow-orange-500/20',
  'from-rose-500 to-pink-600 shadow-rose-500/20',
  'from-cyan-500 to-blue-600 shadow-cyan-500/20'
];

export function getAvatarGradient(name: string): string {
  const safeName = name || 'Membro';
  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function getInitials(name: string): string {
  if (!name || typeof name !== 'string' || !name.trim()) return 'M';
  const parts = name
    .trim()
    .split(/\s+/)
    .map(p => p.replace(/[^a-zA-ZÀ-ÿ0-9]/g, ''))
    .filter(Boolean);

  if (parts.length === 0) {
    const firstChar = name.trim()[0];
    return firstChar ? firstChar.toUpperCase() : 'M';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Normaliza um nome removendo acentos, espaços extras e convertendo para minúsculas.
 */
export function normalizePersonName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compara dois nomes de integrantes tolerando diferenças entre nome curto (ex: "Marllon Fernandes")
 * e nome completo (ex: "Marllon Fernandes da Silva").
 */
export function isSamePersonName(nameA?: string | null, nameB?: string | null): boolean {
  const a = normalizePersonName(nameA);
  const b = normalizePersonName(nameB);
  if (!a || !b) return false;
  if (a === b) return true;

  // Um nome começa com o outro (ex: "marllon fernandes" e "marllon fernandes da silva")
  if (a.startsWith(`${b} `) || b.startsWith(`${a} `)) {
    return true;
  }

  const partsA = a.split(' ').filter(w => !['de', 'da', 'do', 'dos', 'das', 'e'].includes(w));
  const partsB = b.split(' ').filter(w => !['de', 'da', 'do', 'dos', 'das', 'e'].includes(w));

  if (partsA.length >= 2 && partsB.length >= 2) {
    // Mesmo primeiro e segundo nome (ex: "marllon fernandes")
    if (partsA[0] === partsB[0] && partsA[1] === partsB[1]) {
      return true;
    }
    // Mesmo primeiro e último nome
    if (partsA[0] === partsB[0] && partsA[partsA.length - 1] === partsB[partsB.length - 1]) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica se a string de avatar é realmente uma URL de imagem válida ou Data URL
 * (evita exibir ícone de imagem quebrada caso o banco tenha iniciais como "EB", "FE" ou texto inválido no campo avatar).
 */
export function isValidAvatarUrl(avatar?: string | null): boolean {
  if (!avatar || typeof avatar !== 'string') return false;
  const trimmed = avatar.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
}

/**
 * Localiza o cadastro completo de um integrante (incluindo foto do Google quando disponível)
 * a partir do nome exibido na escala ou no evento.
 */
export function resolveMemberData<T extends { id?: string; name: string; email?: string; avatar?: string; role?: string; roles?: string[]; phone?: string }>(
  memberName: string,
  members: T[],
  userProfile?: { id?: string; uid?: string; name?: string; email?: string; avatar?: string; role?: string; roles?: string[] } | null,
  authPhotoUrl?: string | null
): {
  memberObj?: T;
  avatarUrl?: string;
  isCurrentUser: boolean;
} {
  const normTarget = normalizePersonName(memberName);

  // 1. Busca exata (case-insensitive)
  let memberObj = members.find(m => normalizePersonName(m.name) === normTarget);

  // 2. Busca tolerante a nome composto / sobrenome
  if (!memberObj) {
    memberObj = members.find(m => isSamePersonName(m.name, memberName));
  }

  // 3. Verifica se este integrante é o próprio usuário logado
  const isCurrentUser = Boolean(
    userProfile &&
      (isSamePersonName(memberName, userProfile.name) ||
        (memberObj?.id && (memberObj.id === userProfile.id || memberObj.id === userProfile.uid)) ||
        (memberObj?.email &&
          userProfile.email &&
          memberObj.email.trim().toLowerCase() === userProfile.email.trim().toLowerCase()))
  );

  // 4. Resolve a melhor URL de avatar disponível (priorizando foto válida no membro -> perfil logado -> Google Auth -> outro registro do mesmo membro)
  let avatarUrl: string | undefined;

  if (isValidAvatarUrl(memberObj?.avatar)) {
    avatarUrl = memberObj!.avatar!.trim();
  } else if (isCurrentUser && isValidAvatarUrl(userProfile?.avatar)) {
    avatarUrl = userProfile!.avatar!.trim();
  } else if (isCurrentUser && isValidAvatarUrl(authPhotoUrl)) {
    avatarUrl = authPhotoUrl!.trim();
  } else {
    // Procura se existe outro documento do mesmo membro (ex: doc do Google login) com avatar válido
    const otherDocWithAvatar = members.find(
      m =>
        isValidAvatarUrl(m.avatar) &&
        (isSamePersonName(m.name, memberName) ||
          (memberObj?.email && m.email && m.email.trim().toLowerCase() === memberObj.email.trim().toLowerCase()))
    );
    if (otherDocWithAvatar?.avatar) {
      avatarUrl = otherDocWithAvatar.avatar.trim();
    }
  }

  return {
    memberObj,
    avatarUrl,
    isCurrentUser
  };
}

export interface AvatarStyleOption {
  id: string;
  label: string;
  buildUrl: (seed: string) => string;
}

export const DICEBEAR_STYLES: AvatarStyleOption[] = [
  {
    id: 'adventurer',
    label: 'Ilustrado',
    buildUrl: (seed) =>
      `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  },
  {
    id: 'micah',
    label: 'Moderno',
    buildUrl: (seed) =>
      `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  },
  {
    id: 'notionists',
    label: 'Minimalista',
    buildUrl: (seed) =>
      `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  },
  {
    id: 'avataaars',
    label: 'Cartoon',
    buildUrl: (seed) =>
      `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  },
  {
    id: 'fun-emoji',
    label: 'Divertido',
    buildUrl: (seed) =>
      `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}`
  }
];

/**
 * Redimensiona e comprime uma foto selecionada do celular/computador
 * para um quadrado compacto em Base64 (ideal para salvar direto no Firestore).
 */
export function compressImageToDataUrl(
  file: File,
  maxSize = 180,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível processar a imagem.'));
          return;
        }

        // Recorte central quadrado (cover)
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);

        // Tenta WebP primeiro (menor tamanho), com fallback automático para JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Falha ao carregar a imagem selecionada.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}
