import React from 'react';
import {FlatList, Image, StyleSheet, View} from 'react-native';

type Props = {
  photos: string[];
  height?: number;
};

export const PhotoCarousel: React.FC<Props> = ({photos, height = 220}) => {
  return (
    <FlatList
      horizontal
      data={photos}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item, index) => `${item}-${index}`}
      renderItem={({item}) => (
        <View style={[styles.card, {height, width: 320}]}>
          <Image source={{uri: item}} style={styles.image} />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{width: 12}} />}
      contentContainerStyle={{paddingHorizontal: 16}}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2'
  },
  image: {
    flex: 1,
    resizeMode: 'cover'
  }
});
