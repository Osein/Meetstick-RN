import {getServiceErrorMessage, networkClient} from '@/services/network/networkClient';

export type AgreementListItem = {
  id: string;
  title: string;
  version: string;
};

export type AgreementDetail = {
  title: string;
  htmlContent: string;
};

const normalizeAgreement = (item: unknown): AgreementListItem | null => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const agreement = item as Partial<AgreementListItem>;
  const id =
    typeof agreement.id === 'string' ? agreement.id : agreement.id != null ? String(agreement.id) : '';
  const title =
    typeof agreement.title === 'string'
      ? agreement.title
      : agreement.title != null
        ? String(agreement.title)
        : '';

  if (!id || !title) {
    return null;
  }

  const version =
    typeof agreement.version === 'string'
      ? agreement.version
      : agreement.version != null
        ? String(agreement.version)
        : '-';

  return {
    id,
    title,
    version
  };
};

export const getAgreements = async (accessToken?: string): Promise<AgreementListItem[]> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await networkClient.get('/v1/agreements', {headers});
    const payload = response.data as unknown;
    const rawList = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as {agreements?: unknown[]}).agreements)
        ? (payload as {agreements: unknown[]}).agreements
      : payload && typeof payload === 'object' && Array.isArray((payload as {data?: unknown[]}).data)
        ? (payload as {data: unknown[]}).data
        : [];

    return rawList.map(normalizeAgreement).filter((item): item is AgreementListItem => item !== null);
  } catch (error) {
    throw new Error(getServiceErrorMessage(error, 'Sözleşmeler alınamadı.'));
  }
};

export const getAgreementDetail = async (
  id: string,
  version: string,
  accessToken?: string
): Promise<AgreementDetail> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await networkClient.get(
      `/v1/agreements/${encodeURIComponent(id)}/${encodeURIComponent(version)}`,
      {headers}
    );
    const payload = response.data as unknown;
    const data =
      payload && typeof payload === 'object' && 'data' in payload
        ? ((payload as {data?: unknown}).data ?? payload)
        : payload;

    if (!data || typeof data !== 'object') {
      throw new Error('Sözleşme detayı alınamadı.');
    }

    const detail = data as Partial<AgreementDetail>;
    if (typeof detail.title !== 'string' || typeof detail.htmlContent !== 'string') {
      throw new Error('Sözleşme detayı alınamadı.');
    }

    return {
      title: detail.title,
      htmlContent: detail.htmlContent
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'Sözleşme detayı alınamadı.'
        ? error.message
        : getServiceErrorMessage(error, 'Sözleşme detayı alınamadı.');
    throw new Error(message);
  }
};
