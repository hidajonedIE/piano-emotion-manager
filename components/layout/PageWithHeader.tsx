import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useDrawerStatus } from '@react-navigation/drawer';
import { useWindowDimensions } from 'react-native';
import CustomHeader from './CustomHeader';
import { useHeader } from '@/contexts/HeaderContext';

const TABLET_BREAKPOINT = 768;

interface PageWithHeaderProps {
  children: React.ReactNode;
  onMenuPress?: () => void;
}

export default function PageWithHeader({ children, onMenuPress }: PageWithHeaderProps) {
  const { headerConfig } = useHeader();
  const { width } = useWindowDimensions();
  const isTabletOrDesktop = width >= TABLET_BREAKPOINT;

  return (
    <View style={styles.container}>
      <CustomHeader
        title={headerConfig.title}
        subtitle={headerConfig.subtitle}
        icon={headerConfig.icon}
        iconColor={headerConfig.iconColor}
        showBackButton={headerConfig.showBackButton}
        rightAction={headerConfig.rightAction}
        onMenuPress={onMenuPress}
        showMenuButton={!isTabletOrDesktop}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
