type CacheTag = "products" | "orders";

export const getGlobalTag = (tag: CacheTag) => {
  return `global:${tag}` as const;
};

export const getIdTag = (tag: CacheTag, id: string) => {
  return `${tag}:${id}` as const;
};

export const getUserResourceTag = (userId: string, tag: CacheTag) => {
  return `user:${userId}:${tag}` as const;
};
