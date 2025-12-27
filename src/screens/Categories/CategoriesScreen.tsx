import React, {useState} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {categories as mockCategories} from '@/data/mockData';
import {Screen} from '@/components/Screen';
import {AppHeader} from '@/components/AppHeader';
import {palette} from '@/theme/colors';
import {RootStackParamList} from '@/navigation/types';
import {EventCategory} from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const CategoriesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<EventCategory[]>(mockCategories);

  const toggleFavorite = (category: EventCategory) => {
    setItems(prev =>
      prev.map(item => (item.id === category.id ? {...item, isFavorite: !item.isFavorite} : item))
    );
  };

  const renderItem = ({item}: {item: EventCategory}) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('EventList', {categoryId: item.id, categoryTitle: item.title})}
      style={{
        backgroundColor: palette.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: palette.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <View>
        <Text style={{fontSize: 16, fontWeight: '600', color: palette.textPrimary}}>{item.title}</Text>
        <Text style={{color: palette.textSecondary}}>{item.eventCount} etkinlik</Text>
      </View>
      <TouchableOpacity onPress={() => toggleFavorite(item)}>
        <Text style={{color: item.isFavorite ? palette.primary : palette.muted}}>
          {item.isFavorite ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <AppHeader title="Kategoriler" />
      <FlatList data={items} keyExtractor={item => item.id.toString()} renderItem={renderItem} />
    </Screen>
  );
};
