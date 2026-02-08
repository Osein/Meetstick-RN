import {toast} from '@backpackapp-io/react-native-toast';

export const showErrorToast = (message: string) => {
  const text = message.trim().length > 0 ? message : 'Bir hata oluştu.';
  toast.error(text);
};
