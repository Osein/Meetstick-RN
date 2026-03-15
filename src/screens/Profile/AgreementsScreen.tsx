import React from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {getAgreements, AgreementListItem, getAgreementDetail} from '@/services/agreements/agreementsService';
import {useAppContext} from '@/context/AppContext';
import {showErrorToast} from '@/services/ui/toastService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const AgreementsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {state} = useAppContext();
  const [agreements, setAgreements] = React.useState<AgreementListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeAgreementId, setActiveAgreementId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const result = await getAgreements(state.user?.accessToken);
        if (isMounted) {
          setAgreements(result);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sözleşmeler alınamadı.';
        showErrorToast(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [state.user?.accessToken]);

  const onOpenAgreement = React.useCallback(
    async (agreement: AgreementListItem) => {
      try {
        setActiveAgreementId(agreement.id);
        const detail = await getAgreementDetail(agreement.id, agreement.version, state.user?.accessToken);
        navigation.navigate('WebView', {
          title: detail.title,
          htmlContent: detail.htmlContent
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sözleşme detayı alınamadı.';
        showErrorToast(message);
      } finally {
        setActiveAgreementId(null);
      }
    },
    [navigation, state.user?.accessToken]
  );

  return (
    <Screen>
      <AppHeader title="Sözleşmeler" onBack={() => navigation.goBack()} />
      {isLoading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={agreements}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 16, gap: 12}}
          ListEmptyComponent={
            <View style={{paddingVertical: 24}}>
              <Text style={{textAlign: 'center', color: palette.textSecondary}}>Sözleşme bulunamadı.</Text>
            </View>
          }
          renderItem={({item}) => (
            <Pressable
              disabled={activeAgreementId !== null}
              onPress={() => onOpenAgreement(item)}
              style={{
                backgroundColor: palette.surface,
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: palette.border,
                opacity: activeAgreementId && activeAgreementId !== item.id ? 0.6 : 1
              }}
            >
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <Text style={{fontSize: 16, fontWeight: '600', color: palette.textPrimary, flex: 1}}>{item.title}</Text>
                {activeAgreementId === item.id ? <ActivityIndicator size="small" color={palette.primary} /> : null}
              </View>
              <Text style={{color: palette.textSecondary, marginTop: 6}}>Versiyon: {item.version}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
};
