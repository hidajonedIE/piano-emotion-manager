import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import CustomSidebar from './CustomSidebar';
import CustomHeader from './CustomHeader';

const SIDEBAR_WIDTH = 260;
const TABLET_BREAKPOINT = 768;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function ResponsiveLayout({ children, title }: ResponsiveLayoutProps) {
  const { width } = useWindowDimensions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const isTabletOrDesktop = width >= TABLET_BREAKPOINT;

  return (
    <View style={styles.container}>
      {/* Sidebar fijo en tablet/desktop */}
      {isTabletOrDesktop && (
        <View style={[styles.sidebar, { width: SIDEBAR_WIDTH }]}>
          <CustomSidebar />
        </View>
      )}

      {/* Contenido principal */}
      <View style={styles.mainContent}>
        <CustomHeader
          title={title}
          onMenuPress={() => setDrawerOpen(!drawerOpen)}
          showMenuButton={!isTabletOrDesktop}
        />
        
        <View style={styles.contentArea}>
          {children}
        </View>
      </View>

      {/* Drawer para móvil (overlay) */}
      {!isTabletOrDesktop && drawerOpen && (
        <>
          {/* Backdrop */}
          <View 
            style={styles.backdrop}
            onTouchEnd={() => setDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <View style={[styles.drawer, { width: SIDEBAR_WIDTH }]}>
            <CustomSidebar />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  sidebar: {
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        height: '100vh',
      },
      default: {
        position: 'relative',
      },
    }),
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  contentArea: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    ...Platform.select({
      web: {
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
});
