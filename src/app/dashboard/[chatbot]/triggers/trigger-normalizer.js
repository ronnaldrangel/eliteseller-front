const randomId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const toArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  if (Array.isArray(value?.data?.results)) {
    return value.data.results;
  }

  return [];
};

const resolveDocumentId = (entry) => {
  if (!entry) return null;
  const attributes = entry.attributes ?? {};
  return entry.documentId ?? attributes.documentId ?? null;
};

const resolveEntityId = (entry) => {
  if (!entry) return null;
  const attributes = entry.attributes ?? {};
  return entry.id ?? attributes.id ?? null;
};

const normalizeTriggerContent = (entry) => {
  if (!entry) return null;

  const attributes = entry.attributes ?? entry;
  const documentId = resolveDocumentId(entry);
  const entityId = resolveEntityId(entry);
  const key = documentId ?? entityId ?? randomId();

  return {
    key: String(key),
    id: entityId ? String(entityId) : null,
    documentId: documentId ? String(documentId) : null,
    message: attributes.message ?? "",
  };
};

export const normalizeTriggerEntry = (entry) => {
  if (!entry) return null;

  const attributes = entry.attributes ?? entry;
  const documentId = resolveDocumentId(entry);
  const entityId = resolveEntityId(entry);
  const key = documentId ?? entityId ?? randomId();

  const rawContents = toArray(attributes.trigger_contents);
  const triggerContents = rawContents
    .map(normalizeTriggerContent)
    .filter(Boolean);

  const keywordsValue = attributes.keywords ?? "";

  return {
    key: String(key),
    id: entityId ? String(entityId) : documentId ? String(documentId) : String(key),
    documentId: documentId ? String(documentId) : null,
    name: attributes.name ?? "",
    contexto: attributes.contexto ?? "",
    keywords: keywordsValue,
    keywords_ai: attributes.keywords_ai ?? "",
    available: attributes.available ?? false,
    trigger_contents: triggerContents,
    messages: triggerContents,
    keywordsList: keywordsValue
      ? String(keywordsValue)
          .split(/[\,\s]+/)
          .filter(Boolean)
      : [],
  };
};
