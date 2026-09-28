import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Text,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { AnonUTheme } from '../constants/theme';

interface ImageGridProps {
  urls: string[];
}

export const ImageGrid: React.FC<ImageGridProps> = ({ urls }) => {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  if (!urls || urls.length === 0) return null;

  return (
    <View style={styles.container}>
      {urls.length === 1 ? (
        <Pressable
          onPress={() => setFullscreenIndex(0)}
          style={styles.singleImageWrapper}
        >
          <View style={styles.imageShadow} />
          <View style={styles.singleImageFrame}>
            <Image
              source={{ uri: urls[0] }}
              style={styles.singleImage}
              contentFit="cover"
              transition={200}
            />
          </View>
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {urls.slice(0, 4).map((url, idx) => (
            <Pressable
              key={idx}
              onPress={() => setFullscreenIndex(idx)}
              style={styles.gridItemWrapper}
            >
              <View style={styles.imageShadow} />
              <View style={styles.gridItemFrame}>
                <Image
                  source={{ uri: url }}
                  style={styles.gridImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Fullscreen Viewer Modal */}
      {fullscreenIndex !== null && (
        <Modal
          visible={true}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setFullscreenIndex(null)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {`IMAGE ${fullscreenIndex + 1}/${urls.length}`}
              </Text>
              <Pressable
                onPress={() => setFullscreenIndex(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.fullscreenImageContainer}>
              <Image
                source={{ uri: urls[fullscreenIndex] }}
                style={styles.fullscreenImage}
                contentFit="contain"
              />
            </View>

            {/* Pagination dots if multiple images */}
            {urls.length > 1 && (
              <View style={styles.dotsRow}>
                {urls.map((_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setFullscreenIndex(i)}
                    style={[
                      styles.dot,
                      i === fullscreenIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    width: '100%',
  },
  singleImageWrapper: {
    position: 'relative',
    height: 220,
    width: '100%',
  },
  imageShadow: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: 0,
    bottom: 0,
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    width: '100%',
    height: '100%',
  },
  singleImageFrame: {
    height: 220,
    width: '100%',
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    position: 'relative',
    width: '48.5%',
    height: 120,
    marginBottom: 8,
  },
  gridItemFrame: {
    width: '100%',
    height: 120,
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AnonUTheme.black,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    color: AnonUTheme.white,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
    backgroundColor: '#333333',
    borderRadius: 4,
  },
  closeText: {
    color: AnonUTheme.white,
    fontWeight: '900',
    fontSize: 16,
  },
  fullscreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555555',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: AnonUTheme.popYellow,
    width: 18,
  },
});
