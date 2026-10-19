type CacheTag = "products";

export const getGlobalTag = (tag: CacheTag) => {
  return `global:${tag}` as const;
};

export const getIdTag = (tag: string, id: string) => {
  return `${tag}:${id}` as const;
};

export const getUserResourceTag = (userId: string, tag: string) => {
  return `user:${userId}:${tag}` as const;
};
