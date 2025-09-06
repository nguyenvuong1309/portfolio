# Câu Hỏi Phỏng Vấn Senior Level - React Navigation

## 1. Architecture & Core Concepts

### Q: Explain the architecture of React Navigation v6 và những thay đổi chính so với v5?

**A:** React Navigation v6 đại diện cho một bước tiến lớn trong architecture và developer experience so với v5.

**Core Architecture Changes:**

React Navigation v6 được rebuild từ đầu với focus vào performance và type safety. Thay vì sử dụng JavaScript-based stack navigator như v5, v6 giới thiệu Native Stack Navigator sử dụng native navigation primitives của iOS và Android. Điều này có nghĩa là transitions và gestures được handle bởi native code, resulting in smoother animations và better performance.

Architecture mới cũng simplify cách chúng ta define navigation structure. V5 yêu cầu complex configuration objects, trong khi v6 sử dụng declarative approach với JSX, making it more intuitive cho React developers.

**Key Changes từ v5 lên v6:**

1. **Native Stack Navigator**: Đây là thay đổi lớn nhất. Thay vì JavaScript-based navigation, v6 leverage native navigation controllers trên iOS (UINavigationController) và Android (Fragment). Điều này result in:
   - Faster navigation transitions
   - Native-feeling animations
   - Better memory management
   - Automatic handling của system gestures (như swipe back trên iOS)

2. **TypeScript First Approach**: V6 được design từ đầu với TypeScript support. Type definitions được improve significantly, providing better IntelliSense và compile-time error checking. Navigation parameters are now type-safe by default.

3. **Simplified API Surface**: Nhiều APIs được simplified hoặc removed. Ví dụ, `createAppContainer` đã được thay thế bởi `NavigationContainer` với simpler setup.

4. **Better Performance**: V6 implement lazy loading cho screens by default, meaning screens chỉ được mount khi cần thiết. Cũng có improvements trong re-render optimization.

5. **New Linking API**: Deep linking configuration được redesign để more flexible và powerful. Bây giờ có thể handle complex nested navigation scenarios dễ dàng hơn.

6. **Improved Developer Experience**: Better error messages, warning messages, và debugging tools. DevTools integration cũng được improve.

**Migration Challenges:**

Migrate từ v5 lên v6 không phải là straightforward vì có breaking changes in core APIs. Screen options configuration changed, navigation prop structure có differences, và một số methods được renamed hoặc removed. Tuy nhiên, benefits về performance và developer experience make migration worthwhile cho most projects.

### Q: How do you implement complex nested navigation với type safety trong large-scale apps?

**A:** Implementing complex nested navigation với type safety trong large-scale applications requires careful planning và structured approach.

**Type Safety Strategy:**

Đầu tiên, tôi establish một comprehensive type system cho toàn bộ navigation structure. Điều này bắt đầu bằng việc define root-level param lists cho mỗi navigator, sau đó cascade down qua nested navigators. Type system này phải cover tất cả possible navigation paths và parameters.

Key principle là sử dụng TypeScript's `NavigatorScreenParams` utility type để properly type nested navigators. Điều này ensures rằng khi navigate to nested screens, chúng ta có full type safety cho both screen name và parameters.

**Architecture Patterns:**

Trong large-scale apps, tôi implement multi-layer navigation architecture:

1. **Root Level**: Authentication flow vs Main app flow separation
2. **Main Level**: Tab-based navigation cho primary features  
3. **Feature Level**: Stack navigators cho mỗi major feature
4. **Modal Level**: Cross-cutting concerns như settings, profile modals

Mỗi level có riêng param list definitions và screen configurations. Điều này creates clear boundaries và makes codebase maintainable khi scale up.

**Component Organization:**

Navigation components được organize theo feature-based structure. Mỗi feature có riêng navigator file, screen components, và type definitions. Điều này promotes code reusability và makes testing easier.

Custom hooks được create để abstract common navigation patterns. Ví dụ, `useFeatureNavigation` hook provides typed navigation methods specific cho một feature, eliminating need để manually type navigation calls.

**Screen Management:**

Trong complex apps với many screens, lazy loading becomes critical. Screens được lazy-loaded using React's `lazy()` function, improving initial app startup time. Screen components cũng được optimize để prevent unnecessary re-renders during navigation transitions.

**Parameter Validation:**

Beyond TypeScript compile-time checking, runtime parameter validation được implement using libraries như Joi hoặc Yup. Điều này ensures data integrity khi parameters come từ external sources như deep links hoặc push notifications.

```typescript
// Types definition
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>
  Main: NavigatorScreenParams<MainTabParamList>
  Modal: { type: 'user-profile' | 'settings', data?: any }
}

export type AuthStackParamList = {
  Login: undefined
  Register: { referralCode?: string }
  ForgotPassword: { email?: string }
}

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>
  Profile: NavigatorScreenParams<ProfileStackParamList>
  Settings: undefined
}

export type HomeStackParamList = {
  PropertyList: { category?: string, location?: string }
  PropertyDetails: { propertyId: string, fromScreen?: string }
  BookingFlow: { propertyId: string, checkIn: string, checkOut: string }
}

// Navigation structure
function RootNavigator() {
  return (
    <RootStack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="Auth"
    >
      <RootStack.Screen name="Auth" component={AuthNavigator} />
      <RootStack.Screen 
        name="Main" 
        component={MainNavigator}
        options={{ gestureEnabled: false }}
      />
      <RootStack.Group screenOptions={{ presentation: 'modal' }}>
        <RootStack.Screen name="Modal" component={ModalScreen} />
      </RootStack.Group>
    </RootStack.Navigator>
  )
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          return <TabBarIcon route={route} focused={focused} color={color} size={size} />
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Home',
          headerShown: false
        }}
      />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  )
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="PropertyList" 
        component={PropertyListScreen}
        options={{
          title: 'Properties',
          headerSearchBarOptions: {
            placeholder: 'Search properties...'
          }
        }}
      />
      <HomeStack.Screen 
        name="PropertyDetails" 
        component={PropertyDetailsScreen}
        options={({ route }) => ({
          title: 'Property Details',
          headerBackTitleVisible: false,
          headerRight: () => (
            <ShareButton propertyId={route.params.propertyId} />
          )
        })}
      />
      <HomeStack.Screen 
        name="BookingFlow" 
        component={BookingFlowScreen}
        options={{
          title: 'Book Property',
          headerBackTitle: 'Back',
          gestureEnabled: false // Prevent accidental dismissal
        }}
      />
    </HomeStack.Navigator>
  )
}

// Custom hook for type-safe navigation
export function useAppNavigation() {
  return useNavigation<NavigationProp<RootStackParamList>>()
}

export function useAppRoute<T extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, T>>()
}

// Usage in components
function PropertyListScreen() {
  const navigation = useAppNavigation()
  const route = useAppRoute<'PropertyList'>()
  
  const navigateToDetails = (propertyId: string) => {
    navigation.navigate('Main', {
      screen: 'Home',
      params: {
        screen: 'PropertyDetails',
        params: { 
          propertyId,
          fromScreen: 'PropertyList'
        }
      }
    })
  }
  
  return <PropertyListComponent onPropertyPress={navigateToDetails} />
}
```

## 2. Performance Optimization

### Q: How do you optimize React Navigation performance in large applications?

**A:** Optimizing React Navigation performance trong large applications requires multi-layered approach focusing on loading time, memory usage, và user experience.

**Screen Lazy Loading Strategy:**

Đầu tiên, tôi implement lazy loading cho tất cả screens sử dụng React's `lazy()` function combined with `Suspense`. Điều này có nghĩa là screen components chỉ được loaded khi user actually navigates to them, significantly reducing initial bundle size và app startup time.

Key principle là identify which screens are critical for initial user experience (như Home screen) và load immediately, while deferring less important screens. Navigation structure được organize để minimize critical path screens.

**Memory Management Techniques:**

Memory leaks là major concern trong navigation-heavy apps. Tôi implement proper cleanup mechanisms trong screen components - removing event listeners, cancelling network requests, và clearing timers khi screens unmount.

Screen components được optimize để prevent unnecessary re-renders during navigation transitions. Using `React.memo`, `useMemo`, và `useCallback` strategically để minimize compute overhead during navigation events.

Navigation state được manage carefully để avoid accumulating too much navigation history. Deep stacks có thể cause memory issues, nên implement stack resetting strategies cho certain navigation flows.

**Navigation Options Optimization:**

Screen options được memoize để prevent constant recalculation during navigation. Dynamic options (như titles based on data) được compute efficiently với proper dependency arrays.

Header components được optimize separately vì they render frequently during transitions. Custom header implementations sometimes perform better than default headers cho complex UI requirements.

**Bundle Splitting Strategy:**

Large applications benefit from code splitting at navigation level. Each major navigation branch (như different tab stacks) được split into separate bundles. Điều này allows progressive loading based on user navigation patterns.

Route-based code splitting được implement để ensure users chỉ download code cho features they actually use. Analytics data helps identify which features to prioritize trong loading order.

**Performance Monitoring:**

Navigation performance được monitor using custom metrics - measuring time between navigation calls và screen render completion. Slow navigation transitions được identified và optimized specifically.

Memory usage monitoring helps detect leaks early trong development cycle. Performance budgets được establish cho navigation transitions - typically targeting under 100ms cho simple navigations và under 300ms cho complex screen loads.

```typescript
// 1. Lazy Loading Screens
const LazyPropertyDetailsScreen = lazy(() => import('./screens/PropertyDetailsScreen'))
const LazyBookingFlowScreen = lazy(() => import('./screens/BookingFlowScreen'))

function HomeNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="PropertyList" component={PropertyListScreen} />
      <HomeStack.Screen 
        name="PropertyDetails" 
        component={LazyPropertyDetailsScreen}
        options={{
          // Preload the component when user starts navigating
          lazy: true
        }}
      />
    </HomeStack.Navigator>
  )
}

// 2. Screen optimization with React.memo and useMemo
const PropertyDetailsScreen = React.memo(({ route, navigation }: Props) => {
  const { propertyId } = route.params
  
  // Memoize expensive calculations
  const propertyData = useMemo(() => {
    return processPropertyData(propertyId)
  }, [propertyId])
  
  // Optimize navigation options
  const navigationOptions = useMemo(() => ({
    title: propertyData?.title || 'Property Details',
    headerRight: () => (
      <ShareButton 
        propertyId={propertyId}
        propertyTitle={propertyData?.title}
      />
    )
  }), [propertyId, propertyData?.title])
  
  useLayoutEffect(() => {
    navigation.setOptions(navigationOptions)
  }, [navigation, navigationOptions])
  
  return <PropertyDetailsComponent data={propertyData} />
})

// 3. Custom Navigator with performance optimization
function OptimizedNavigator() {
  const [isReady, setIsReady] = useState(false)
  const [initialState, setInitialState] = useState()
  
  useEffect(() => {
    const restoreState = async () => {
      try {
        // Restore navigation state from storage
        const savedStateString = await AsyncStorage.getItem('NAVIGATION_STATE')
        const state = savedStateString ? JSON.parse(savedStateString) : undefined
        
        if (state !== undefined) {
          setInitialState(state)
        }
      } finally {
        setIsReady(true)
      }
    }
    
    if (!isReady) {
      restoreState()
    }
  }, [isReady])
  
  if (!isReady) {
    return <SplashScreen />
  }
  
  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) => {
        // Throttle state persistence to avoid excessive writes
        throttledPersistState(state)
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  )
}

// 4. Optimized Tab Navigator với custom tab bar
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index
        
        // Memoize tab item to prevent unnecessary re-renders
        const TabItem = useMemo(() => (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={[
              styles.tabItem,
              isFocused && styles.tabItemFocused
            ]}
          >
            <TabIcon 
              route={route} 
              focused={isFocused}
              color={isFocused ? '#007AFF' : '#8E8E93'}
            />
            <Text style={[
              styles.tabLabel,
              isFocused && styles.tabLabelFocused
            ]}>
              {options.tabBarLabel || route.name}
            </Text>
          </TouchableOpacity>
        ), [route.key, isFocused, navigation])
        
        return TabItem
      })}
    </View>
  )
}

// 5. Navigation state management với Redux
const navigationSlice = createSlice({
  name: 'navigation',
  initialState: {
    currentRoute: 'Home',
    navigationHistory: [],
    preloadedScreens: new Set<string>()
  },
  reducers: {
    setCurrentRoute: (state, action) => {
      state.currentRoute = action.payload
      state.navigationHistory.push({
        route: action.payload,
        timestamp: Date.now()
      })
    },
    preloadScreen: (state, action) => {
      state.preloadedScreens.add(action.payload)
    }
  }
})

// 6. Custom navigation middleware for analytics
const navigationAnalyticsMiddleware = {
  onNavigate: (routeName: string, params?: any) => {
    // Track screen views
    Analytics.track('screen_view', {
      screen_name: routeName,
      screen_params: params
    })
  },
  
  onNavigateBack: (fromRoute: string, toRoute: string) => {
    Analytics.track('navigation_back', {
      from_screen: fromRoute,
      to_screen: toRoute
    })
  }
}
```

### Q: How do you handle memory management and prevent memory leaks trong React Navigation?

**A:** Memory management trong React Navigation applications requires systematic approach để prevent accumulation of unused resources và ensure smooth performance over time.

**Lifecycle-Based Cleanup Strategy:**

Memory leaks thường occur khi components fail để properly cleanup resources khi unmounting. Tôi implement comprehensive cleanup trong useEffect hooks - ensuring all subscriptions, timers, và event listeners được properly removed.

Critical principle là treating each screen như một self-contained unit with complete lifecycle management. Screen components phải be able để cleanup completely khi user navigates away, without leaving any dangling references hoặc active processes.

**Navigation Event Listener Management:**

React Navigation provides various event listeners (focus, blur, beforeRemove) mà screens có thể subscribe to. Improper handling của these listeners là common source của memory leaks. Mỗi listener registration phải have corresponding cleanup function.

Important pattern là using navigation event listeners để pause expensive operations khi screens go out of focus và resume khi they return to focus. Điều này prevents background screens từ consuming resources unnecessarily.

**State and Data Management:**

Screen-level state được manage carefully để avoid retaining large objects trong memory. Complex data structures được stored trong global state management solutions (như Redux) rather than component state khi they need to persist across navigation.

Local state trong screens được design để be minimal và transient. Heavy computations kết quả được cached appropriately but with proper invalidation strategies.

**Subscription and Timer Cleanup:**

Network requests, WebSocket connections, và periodic timers are major sources của memory leaks. Tôi implement systematic approach để cancel pending requests khi screens unmount và cleanup any active connections.

Subscription-based patterns (như listening to data stores) require careful cleanup. Using cleanup functions trong useEffect ensures subscriptions are properly disposed of khi components unmount.

**Navigation Stack Management:**

Deep navigation stacks có thể accumulate significant memory usage. Strategic stack resetting được implement cho certain workflows - ví dụ, sau khi completing multi-step processes, resetting navigation stack để clear intermediate screens từ memory.

Screen options và navigation parameters được design để be lightweight và not hold references to large objects. This prevents navigation state itself từ causing memory retention issues.

```typescript
// 1. Proper cleanup in screens
function PropertyDetailsScreen({ route, navigation }: Props) {
  const [data, setData] = useState(null)
  const subscriptionRef = useRef<Subscription>()
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    // Setup data subscription
    subscriptionRef.current = PropertyService.subscribe(
      route.params.propertyId,
      (newData) => setData(newData)
    )
    
    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [route.params.propertyId])
  
  // Listen for navigation events
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      // Screen focused - resume subscriptions
      if (subscriptionRef.current?.isClosed) {
        subscriptionRef.current = PropertyService.subscribe(
          route.params.propertyId,
          (newData) => setData(newData)
        )
      }
    })
    
    const unsubscribeBlur = navigation.addListener('blur', () => {
      // Screen blurred - pause expensive operations
      if (subscriptionRef.current) {
        subscriptionRef.current.pause()
      }
    })
    
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', () => {
      // Screen will be removed - cleanup everything
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    })
    
    return () => {
      unsubscribeFocus()
      unsubscribeBlur()
      unsubscribeBeforeRemove()
    }
  }, [navigation, route.params.propertyId])
  
  return <PropertyDetails data={data} />
}

// 2. Memory-efficient navigation container
function MemoryEfficientNavigationContainer({ children }: Props) {
  const navigationRef = useRef<NavigationContainerRef>(null)
  const routeNameRef = useRef<string>()
  
  // Track memory usage
  useEffect(() => {
    const memoryMonitor = setInterval(() => {
      if (__DEV__) {
        // Monitor memory in development
        console.log('Memory usage:', performance.memory?.usedJSHeapSize)
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(memoryMonitor)
  }, [])
  
  const onStateChange = useCallback(() => {
    const previousRouteName = routeNameRef.current
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name
    
    if (previousRouteName !== currentRouteName) {
      // Trigger garbage collection hint
      if (global.gc && __DEV__) {
        global.gc()
      }
      
      routeNameRef.current = currentRouteName
    }
  }, [])
  
  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={onStateChange}
      onUnhandledAction={(action) => {
        // Log unhandled actions for debugging
        console.warn('Unhandled navigation action:', action)
      }}
    >
      {children}
    </NavigationContainer>
  )
}

// 3. Optimized screen with proper lifecycle management
class OptimizedScreen extends React.Component {
  private subscriptions: Subscription[] = []
  private timers: NodeJS.Timeout[] = []
  
  componentDidMount() {
    // Focus listener
    this.subscriptions.push(
      this.props.navigation.addListener('focus', this.onScreenFocus)
    )
    
    // Blur listener  
    this.subscriptions.push(
      this.props.navigation.addListener('blur', this.onScreenBlur)
    )
  }
  
  componentWillUnmount() {
    // Cleanup all subscriptions
    this.subscriptions.forEach(sub => sub())
    this.subscriptions = []
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers = []
  }
  
  onScreenFocus = () => {
    // Resume expensive operations
    this.resumeDataFetching()
  }
  
  onScreenBlur = () => {
    // Pause expensive operations to save memory
    this.pauseDataFetching()
  }
  
  addTimer = (callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    this.timers.push(timer)
    return timer
  }
  
  render() {
    return <ScreenContent />
  }
}
```

## 3. Deep Linking & URL Handling

### Q: Implement comprehensive deep linking system với authentication guards?

**A:** Implementing comprehensive deep linking với authentication guards requires sophisticated approach để balance user experience với security requirements.

**Deep Linking Architecture:**

Deep linking system được build với multiple layers of validation và processing. URL structure được design để be intuitive và SEO-friendly while maintaining security. Each URL pattern maps to specific screen configurations với proper parameter validation.

Key principle là creating flexible linking configuration mà có thể handle nested navigation scenarios. URLs should reflect navigation hierarchy naturally - ví dụ, `/property/123/booking/dates` clearly indicates nested navigation path.

**Authentication Guard Implementation:**

Authentication guards act như middleware trong deep linking pipeline. Khi user clicks deep link hoặc enters URL, system first checks authentication requirements cho target screen. Unauthenticated users được redirect to login với return URL stored cho later navigation.

Guard system supports different authentication levels - public routes, authenticated routes, premium user routes, admin routes. Each route được tagged với required authentication level và guards check user credentials accordingly.

**State Preservation During Auth Flow:**

Critical challenge là preserving user's intended destination during authentication flow. Khi unauthenticated user tries to access protected content, system stores deep link parameters trong secure storage và restores intended navigation sau successful authentication.

This requires careful handling của navigation state - ensuring original parameters are maintained và restored correctly without security vulnerabilities. Pending navigation state được encrypted và expires after reasonable timeout.

**URL Parameter Validation:**

Deep link parameters undergo comprehensive validation - both client-side và server-side. Invalid parameters don't crash app but instead redirect to appropriate fallback screens với helpful error messages.

Parameter validation includes type checking, format validation, và business logic validation. Ví dụ, date parameters được validated cho proper format và logical ranges. ID parameters được validated cho existence và user access permissions.

**Universal Links và App Links:**

Implementation supports both iOS Universal Links và Android App Links cho seamless user experience. This allows URLs to open directly trong app khi installed, falling back to web version khi not installed.

Universal link configuration requires careful setup của associated domains và proper handling của link callbacks. System gracefully handles edge cases như app not installed hoặc older app versions mà don't support specific deep link patterns.

```typescript
// 1. Deep linking configuration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://', 'https://myapp.com', 'https://www.myapp.com'],
  
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register/:referralCode?',
          ForgotPassword: 'forgot-password'
        }
      },
      Main: {
        screens: {
          Home: {
            screens: {
              PropertyList: {
                path: 'properties/:category?',
                parse: {
                  category: (category: string) => 
                    category ? decodeURIComponent(category) : undefined
                }
              },
              PropertyDetails: {
                path: 'property/:propertyId/:slug?',
                parse: {
                  propertyId: (id: string) => id,
                  slug: (slug: string) => slug ? decodeURIComponent(slug) : undefined
                }
              },
              BookingFlow: {
                path: 'book/:propertyId/:checkIn/:checkOut',
                parse: {
                  propertyId: (id: string) => id,
                  checkIn: (date: string) => date,
                  checkOut: (date: string) => date
                }
              }
            }
          },
          Profile: {
            screens: {
              UserProfile: 'profile',
              Settings: 'settings',
              BookingHistory: 'bookings'
            }
          }
        }
      },
      Modal: {
        path: 'modal/:type/:id?',
        parse: {
          type: (type: string) => type as 'user-profile' | 'settings',
          id: (id: string) => id || undefined
        }
      }
    }
  },
  
  // Custom URL parsing
  getInitialURL: async () => {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL()
    
    if (url != null) {
      return url
    }
    
    // Check for universal links (iOS) or App Links (Android)
    const message = await messaging().getInitialNotification()
    return message?.data?.deepLink || null
  },
  
  // Subscribe to incoming links
  subscribe(listener) {
    // Listen for deep links when app is running
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url)
    })
    
    // Listen for notification deep links
    const notificationSubscription = messaging().onNotificationOpenedApp(
      (message) => {
        if (message.data?.deepLink) {
          listener(message.data.deepLink)
        }
      }
    )
    
    return () => {
      linkingSubscription?.remove()
      notificationSubscription()
    }
  }
}

// 2. Authentication-aware deep link handler
function useAuthenticatedDeepLinking() {
  const { isAuthenticated, user } = useAuth()
  const navigation = useAppNavigation()
  
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      const route = await parseDeepLink(url)
      
      if (!route) return
      
      // Check if route requires authentication
      if (requiresAuth(route) && !isAuthenticated) {
        // Store intended destination
        await AsyncStorage.setItem('PENDING_DEEP_LINK', url)
        
        // Navigate to login with return URL
        navigation.navigate('Auth', {
          screen: 'Login',
          params: { 
            returnUrl: url,
            message: 'Please log in to access this content'
          }
        })
        return
      }
      
      // Check user permissions
      if (requiresPermissions(route) && !hasPermissions(user, route)) {
        // Show permission denied modal
        navigation.navigate('Modal', {
          type: 'permission-denied',
          data: { requiredPermissions: getRequiredPermissions(route) }
        })
        return
      }
      
      // Navigate to the route
      navigateToRoute(route)
    }
    
    // Handle pending deep link after authentication
    if (isAuthenticated) {
      const processPendingDeepLink = async () => {
        const pendingUrl = await AsyncStorage.getItem('PENDING_DEEP_LINK')
        if (pendingUrl) {
          await AsyncStorage.removeItem('PENDING_DEEP_LINK')
          handleDeepLink(pendingUrl)
        }
      }
      processPendingDeepLink()
    }
    
    return Linking.addEventListener('url', ({ url }) => handleDeepLink(url))
  }, [isAuthenticated, user, navigation])
}

// 3. Deep link validation and parsing
interface ParsedDeepLink {
  screen: string
  params: Record<string, any>
  requiresAuth: boolean
  requiredPermissions: string[]
}

class DeepLinkParser {
  static async parseDeepLink(url: string): Promise<ParsedDeepLink | null> {
    try {
      const parsedUrl = new URL(url)
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
      
      // Property details: /property/:id/:slug?
      if (pathSegments[0] === 'property' && pathSegments[1]) {
        const propertyExists = await PropertyService.checkExists(pathSegments[1])
        if (!propertyExists) {
          throw new Error('Property not found')
        }
        
        return {
          screen: 'PropertyDetails',
          params: {
            propertyId: pathSegments[1],
            slug: pathSegments[2],
            fromDeepLink: true
          },
          requiresAuth: false,
          requiredPermissions: []
        }
      }
      
      // Booking flow: /book/:propertyId/:checkIn/:checkOut
      if (pathSegments[0] === 'book' && pathSegments.length >= 4) {
        const [, propertyId, checkIn, checkOut] = pathSegments
        
        // Validate dates
        if (!this.isValidDate(checkIn) || !this.isValidDate(checkOut)) {
          throw new Error('Invalid booking dates')
        }
        
        // Validate property availability
        const isAvailable = await BookingService.checkAvailability(
          propertyId, 
          checkIn, 
          checkOut
        )
        
        if (!isAvailable) {
          throw new Error('Property not available for selected dates')
        }
        
        return {
          screen: 'BookingFlow',
          params: { propertyId, checkIn, checkOut },
          requiresAuth: true,
          requiredPermissions: ['can_book']
        }
      }
      
      // User profile: /profile
      if (pathSegments[0] === 'profile') {
        return {
          screen: 'UserProfile',
          params: {},
          requiresAuth: true,
          requiredPermissions: []
        }
      }
      
      return null
    } catch (error) {
      console.error('Deep link parsing error:', error)
      return null
    }
  }
  
  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }
}

// 4. Universal link handling (iOS) và App Links (Android)
function UniversalLinkHandler() {
  useEffect(() => {
    // iOS Universal Links
    if (Platform.OS === 'ios') {
      const subscription = Linking.addEventListener('url', ({ url }) => {
        if (url.includes('myapp.com')) {
          // Handle universal link
          handleUniversalLink(url)
        }
      })
      
      return () => subscription?.remove()
    }
    
    // Android App Links
    if (Platform.OS === 'android') {
      const checkAppLink = async () => {
        const initialUrl = await Linking.getInitialURL()
        if (initialUrl?.includes('myapp.com')) {
          handleAppLink(initialUrl)
        }
      }
      
      checkAppLink()
    }
  }, [])
  
  return null
}

// 5. Custom URL generation for sharing
class URLGenerator {
  static generatePropertyURL(propertyId: string, propertySlug?: string): string {
    const baseUrl = 'https://myapp.com'
    const slug = propertySlug || propertyId
    return `${baseUrl}/property/${propertyId}/${encodeURIComponent(slug)}`
  }
  
  static generateBookingURL(
    propertyId: string, 
    checkIn: string, 
    checkOut: string
  ): string {
    const baseUrl = 'https://myapp.com'
    return `${baseUrl}/book/${propertyId}/${checkIn}/${checkOut}`
  }
  
  static generateShareableURL(
    screen: string, 
    params: Record<string, any>,
    utmSource?: string
  ): string {
    const baseUrl = 'https://myapp.com'
    const queryParams = new URLSearchParams()
    
    // Add UTM parameters
    if (utmSource) {
      queryParams.set('utm_source', utmSource)
      queryParams.set('utm_medium', 'share')
      queryParams.set('utm_campaign', 'user_share')
    }
    
    let path = ''
    switch (screen) {
      case 'PropertyDetails':
        path = `/property/${params.propertyId}`
        break
      case 'PropertyList':
        path = `/properties/${params.category || ''}`
        break
      default:
        path = '/'
    }
    
    const queryString = queryParams.toString()
    return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`
  }
}
```

## 4. Advanced Navigation Patterns

### Q: Implement complex navigation flows like onboarding, authentication, and modal presentations?

**A:** Complex navigation flows require careful orchestration của multiple navigation states và user experience considerations.

**Authentication Flow Architecture:**

Authentication flows present unique challenges vì they must handle multiple user states gracefully. System must differentiate between completely new users, returning users với expired sessions, và users with valid authentication but incomplete onboarding.

Key principle là conditional navigation rendering based on authentication state. Instead of navigating programmatically, navigation structure itself changes based on user authentication status. This provides cleaner separation của concerns và prevents navigation stack pollution.

Authentication state transitions được handle smoothly với appropriate loading states. Users should never see jarring navigation changes hoặc be confused about their current location trong app flow.

**Onboarding Flow Management:**

Onboarding flows require sequential presentation của screens với ability để skip, go back, và resume where left off. Multi-step onboarding được implement với centralized state management tracking completion status của each step.

Critical consideration là handling interruptions - users might close app mid-onboarding và return later. System preserves onboarding progress và resumes from appropriate step rather than restarting completely.

Onboarding completion triggers navigation stack reset để prevent users from accidentally navigating back to onboarding screens sau completion. This ensures clean transition to main app experience.

**Modal Presentation Strategy:**

Modal presentations require careful consideration của navigation context và presentation styles. Different modal types (full-screen, sheet, popup) serve different purposes và should be chosen based on content importance và user workflow.

Modal stack management prevents modals from accumulating indefinitely. System limits modal depth và provides clear dismissal paths. Complex modal flows (như multi-step forms) được handle với internal navigation while maintaining modal presentation context.

Cross-modal navigation patterns được handled carefully - ensuring users can navigate between related modals without losing context hoặc creating confusing navigation experiences.

**State Persistence Across Flows:**

Complex flows often involve temporary state mà needs to persist across navigation changes. Form data, user selections, và progress states are preserved using appropriate storage mechanisms.

State cleanup is equally important - ensuring temporary states are cleared khi flows complete hoặc are abandoned. This prevents state pollution và ensures fresh experiences cho subsequent flow executions.

**Flow Interruption Handling:**

Real-world usage involves flow interruptions - incoming calls, app backgrounding, notification taps. System gracefully handles these interruptions và provides appropriate resume experiences khi users return to app.

Navigation state được preserved during interruptions với ability to restore exact user location và context. This requires careful state serialization và restoration logic.

```typescript
// 1. Authentication Flow với Conditional Navigation
function AuthenticationNavigator() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuth()
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        await AuthService.checkAuthStatus()
      } finally {
        setIsReady(true)
      }
    }
    
    checkAuthState()
  }, [])
  
  if (isLoading || !isReady) {
    return <SplashScreen />
  }
  
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth screens
        <RootStack.Group>
          <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        </RootStack.Group>
      ) : !hasCompletedOnboarding ? (
        // Onboarding flow
        <RootStack.Group>
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        </RootStack.Group>
      ) : (
        // Main app flow
        <RootStack.Group>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          
          {/* Modal presentations */}
          <RootStack.Group 
            screenOptions={{ 
              presentation: 'modal',
              headerShown: true,
              gestureEnabled: true,
              cardOverlayEnabled: true
            }}
          >
            <RootStack.Screen 
              name="ProfileModal" 
              component={ProfileModalScreen}
              options={{
                title: 'Profile Settings',
                headerLeft: () => (
                  <Button title="Cancel" onPress={() => navigation.goBack()} />
                )
              }}
            />
            <RootStack.Screen name="FilterModal" component={FilterModalScreen} />
            <RootStack.Screen name="ImageGallery" component={ImageGalleryScreen} />
          </RootStack.Group>
          
          {/* Full screen modals */}
          <RootStack.Group
            screenOptions={{
              presentation: 'formSheet',
              headerShown: false
            }}
          >
            <RootStack.Screen name="BookingFlow" component={BookingFlowNavigator} />
            <RootStack.Screen name="PropertyEditor" component={PropertyEditorFlow} />
          </RootStack.Group>
        </RootStack.Group>
      )}
    </RootStack.Navigator>
  )
}

// 2. Multi-step Onboarding Flow
function OnboardingNavigator() {
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState({})
  
  const steps = [
    'Welcome',
    'Permissions',
    'PersonalInfo', 
    'Preferences',
    'Complete'
  ]
  
  const handleNext = (stepData?: any) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }))
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeOnboarding()
    }
  }
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }
  
  const completeOnboarding = async () => {
    try {
      await OnboardingService.complete(onboardingData)
      // Navigation will automatically update due to auth state change
    } catch (error) {
      console.error('Onboarding completion failed:', error)
    }
  }
  
  return (
    <OnboardingStack.Navigator 
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back during onboarding
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS
      }}
    >
      <OnboardingStack.Screen name="OnboardingStep">
        {() => (
          <OnboardingStepScreen
            step={steps[currentStep]}
            stepNumber={currentStep + 1}
            totalSteps={steps.length}
            onNext={handleNext}
            onBack={currentStep > 0 ? handleBack : undefined}
            data={onboardingData}
          />
        )}
      </OnboardingStack.Screen>
    </OnboardingStack.Navigator>
  )
}

// 3. Complex Booking Flow với State Management
function BookingFlowNavigator() {
  const route = useRoute<RouteProp<RootStackParamList, 'BookingFlow'>>()
  const { propertyId } = route.params
  
  return (
    <BookingProvider propertyId={propertyId}>
      <BookingStack.Navigator
        screenOptions={{
          headerBackTitleVisible: false,
          gestureEnabled: true
        }}
      >
        <BookingStack.Screen 
          name="DateSelection"
          component={DateSelectionScreen}
          options={{
            title: 'Select Dates',
            headerLeft: () => <CloseButton />
          }}
        />
        <BookingStack.Screen 
          name="GuestDetails"
          component={GuestDetailsScreen}
          options={{
            title: 'Guest Details'
          }}
        />
        <BookingStack.Screen 
          name="PaymentMethod"
          component={PaymentMethodScreen}
          options={{
            title: 'Payment'
          }}
        />
        <BookingStack.Screen 
          name="BookingReview"
          component={BookingReviewScreen}
          options={{
            title: 'Review Booking',
            gestureEnabled: false // Prevent accidental back
          }}
        />
        <BookingStack.Screen 
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{
            title: 'Booking Confirmed',
            headerLeft: () => null, // Remove back button
            gestureEnabled: false
          }}
        />
      </BookingStack.Navigator>
    </BookingProvider>
  )
}

// 4. Advanced Modal Management
interface ModalState {
  modals: Array<{
    id: string
    component: React.ComponentType<any>
    props?: any
    options?: StackNavigationOptions
  }>
}

function ModalManager() {
  const [modalStack, setModalStack] = useState<ModalState['modals']>([])
  
  const presentModal = useCallback((
    component: React.ComponentType<any>,
    props?: any,
    options?: StackNavigationOptions
  ) => {
    const modalId = `modal_${Date.now()}_${Math.random()}`
    
    setModalStack(prev => [...prev, {
      id: modalId,
      component,
      props,
      options
    }])
    
    return modalId
  }, [])
  
  const dismissModal = useCallback((modalId?: string) => {
    if (modalId) {
      setModalStack(prev => prev.filter(modal => modal.id !== modalId))
    } else {
      // Dismiss top modal
      setModalStack(prev => prev.slice(0, -1))
    }
  }, [])
  
  const dismissAllModals = useCallback(() => {
    setModalStack([])
  }, [])
  
  return (
    <ModalContext.Provider value={{
      presentModal,
      dismissModal,
      dismissAllModals,
      modalCount: modalStack.length
    }}>
      <MainNavigationContent />
      
      {/* Render modal stack */}
      {modalStack.map((modal, index) => (
        <RootStack.Screen
          key={modal.id}
          name={modal.id}
          component={modal.component}
          options={{
            presentation: 'modal',
            ...modal.options
          }}
          initialParams={modal.props}
        />
      ))}
    </ModalContext.Provider>
  )
}

// 5. Custom Transition Animations
const customTransitions = {
  // Slide up animation
  slideUp: {
    cardStyleInterpolator: ({ current, layouts }: any) => {
      return {
        cardStyle: {
          transform: [
            {
              translateY: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.height, 0]
              })
            }
          ]
        }
      }
    }
  },
  
  // Fade transition
  fade: {
    cardStyleInterpolator: ({ current }: any) => ({
      cardStyle: {
        opacity: current.progress
      }
    })
  },
  
  // Scale transition
  scale: {
    cardStyleInterpolator: ({ current }: any) => ({
      cardStyle: {
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })
          }
        ],
        opacity: current.progress
      }
    })
  }
}

// Usage with custom transitions
function CustomTransitionNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          ...customTransitions.fade
        }}
      />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{
          ...customTransitions.slideUp,
          gestureDirection: 'vertical'
        }}
      />
    </Stack.Navigator>
  )
}
```

## 5. State Management Integration

### Q: How do you integrate React Navigation với Redux/Context API và handle navigation state?

**A:** Integrating React Navigation với state management requires careful consideration của data flow, performance, và separation of concerns.

**Navigation State Integration Philosophy:**

Navigation state và application state serve different purposes và should be managed appropriately. Navigation state tracks where users are trong app structure, while application state manages business data và user preferences. Over-coupling these can create complexity và performance issues.

Best practice là selectively syncing navigation events với application state rather than storing entire navigation state trong Redux/Context. This approach maintains benefits của both systems while avoiding their respective limitations.

**Redux Integration Patterns:**

Khi integrating với Redux, navigation events trigger actions mà update relevant application state. Ví dụ, navigating to user profile screen might trigger action để mark profile as recently visited hoặc update analytics data.

Navigation middleware provides clean way để intercept navigation actions và dispatch corresponding Redux actions. This maintains clean separation while enabling application state updates based on navigation events.

Critical consideration là preventing circular dependencies giữa navigation actions và state updates. Navigation should respond to state changes appropriately without creating infinite update loops.

**Context API Integration:**

Context API provides lighter-weight integration option for navigation state management. Navigation-specific contexts can wrap navigation containers và provide navigation utilities to child components.

Context pattern works well for providing navigation helpers và abstracting complex navigation logic. Custom hooks build on context values để provide type-safe navigation methods specific to different parts của application.

Performance consideration với Context API là minimizing re-renders khi navigation state changes. Strategic context splitting ensures only components mà actually need navigation updates are re-rendered.

**State Persistence Strategy:**

Navigation state persistence enables users to resume where they left off after app restarts. However, persisting entire navigation state can create problems với stale data và invalid screen parameters.

Selective persistence approach saves only essential navigation context - current tab, recent screen history, và critical navigation parameters. Screen-specific state gets refreshed from server or local storage as needed.

State restoration validation ensures persisted navigation state is still valid - checking that screens still exist, parameters are valid, và user still has access to protected routes.

**Navigation Analytics Integration:**

Navigation events provide valuable analytics data about user behavior và app usage patterns. Integration with analytics services happens through navigation listeners mà track screen views, navigation paths, và user engagement metrics.

Analytics data helps identify navigation pain points, popular user flows, và areas for UX improvement. This data-driven approach enables continuous optimization của navigation experience.

```typescript
// 1. Navigation slice trong Redux
interface NavigationState {
  currentRoute: string
  previousRoute: string | null
  navigationHistory: Array<{
    route: string
    params?: any
    timestamp: number
  }>
  modalStack: string[]
  tabHistory: Record<string, string[]> // Track tab navigation history
}

const navigationSlice = createSlice({
  name: 'navigation',
  initialState: {
    currentRoute: 'Home',
    previousRoute: null,
    navigationHistory: [],
    modalStack: [],
    tabHistory: {}
  } as NavigationState,
  reducers: {
    navigateToScreen: (state, action) => {
      const { routeName, params } = action.payload
      
      state.previousRoute = state.currentRoute
      state.currentRoute = routeName
      
      state.navigationHistory.push({
        route: routeName,
        params,
        timestamp: Date.now()
      })
      
      // Keep history limited to last 50 entries
      if (state.navigationHistory.length > 50) {
        state.navigationHistory = state.navigationHistory.slice(-50)
      }
    },
    
    presentModal: (state, action) => {
      state.modalStack.push(action.payload)
    },
    
    dismissModal: (state) => {
      state.modalStack.pop()
    },
    
    updateTabHistory: (state, action) => {
      const { tabName, route } = action.payload
      if (!state.tabHistory[tabName]) {
        state.tabHistory[tabName] = []
      }
      state.tabHistory[tabName].push(route)
      
      // Keep tab history limited
      if (state.tabHistory[tabName].length > 10) {
        state.tabHistory[tabName] = state.tabHistory[tabName].slice(-10)
      }
    }
  }
})

// 2. Navigation middleware để sync với Redux
const navigationMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)
  
  // Listen for navigation actions
  if (action.type.startsWith('@react-navigation/')) {
    const state = store.getState()
    const currentRoute = getCurrentRouteName(action.state)
    
    if (currentRoute && currentRoute !== state.navigation.currentRoute) {
      store.dispatch(navigationSlice.actions.navigateToScreen({
        routeName: currentRoute,
        params: getCurrentRouteParams(action.state)
      }))
    }
  }
  
  return result
}

// 3. Navigation Context Provider
interface NavigationContextType {
  navigate: (screen: string, params?: any) => void
  goBack: () => void
  reset: (state: any) => void
  presentModal: (modalName: string, props?: any) => void
  dismissModal: () => void
  canGoBack: () => boolean
  getCurrentRoute: () => string | undefined
  getNavigationHistory: () => NavigationHistoryEntry[]
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const navigationRef = useRef<NavigationContainerRef<any>>(null)
  const navigationState = useAppSelector(state => state.navigation)
  
  const navigate = useCallback((screen: string, params?: any) => {
    navigationRef.current?.navigate(screen, params)
    dispatch(navigationSlice.actions.navigateToScreen({ routeName: screen, params }))
  }, [dispatch])
  
  const goBack = useCallback(() => {
    if (navigationRef.current?.canGoBack()) {
      navigationRef.current.goBack()
    }
  }, [])
  
  const reset = useCallback((state: any) => {
    navigationRef.current?.reset(state)
  }, [])
  
  const presentModal = useCallback((modalName: string, props?: any) => {
    navigate(modalName, props)
    dispatch(navigationSlice.actions.presentModal(modalName))
  }, [navigate, dispatch])
  
  const dismissModal = useCallback(() => {
    goBack()
    dispatch(navigationSlice.actions.dismissModal())
  }, [goBack, dispatch])
  
  const canGoBack = useCallback(() => {
    return navigationRef.current?.canGoBack() ?? false
  }, [])
  
  const getCurrentRoute = useCallback(() => {
    return navigationRef.current?.getCurrentRoute()?.name
  }, [])
  
  const getNavigationHistory = useCallback(() => {
    return navigationState.navigationHistory
  }, [navigationState.navigationHistory])
  
  const value = useMemo(() => ({
    navigate,
    goBack,
    reset,
    presentModal,
    dismissModal,
    canGoBack,
    getCurrentRoute,
    getNavigationHistory
  }), [
    navigate, goBack, reset, presentModal, dismissModal,
    canGoBack, getCurrentRoute, getNavigationHistory
  ])
  
  return (
    <NavigationContext.Provider value={value}>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={(state) => {
          // Sync navigation state với Redux
          const currentRouteName = getCurrentRouteName(state)
          if (currentRouteName !== navigationState.currentRoute) {
            dispatch(navigationSlice.actions.navigateToScreen({
              routeName: currentRouteName,
              params: getCurrentRouteParams(state)
            }))
          }
        }}
      >
        {children}
      </NavigationContainer>
    </NavigationContext.Provider>
  )
}

// 4. Custom hooks for navigation
export function useAppNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useAppNavigation must be used within NavigationProvider')
  }
  return context
}

export function useNavigationAnalytics() {
  const { getCurrentRoute, getNavigationHistory } = useAppNavigation()
  const dispatch = useAppDispatch()
  
  const trackScreenView = useCallback((screenName: string, params?: any) => {
    // Track screen view in analytics
    Analytics.track('screen_view', {
      screen_name: screenName,
      screen_params: params,
      timestamp: Date.now()
    })
    
    // Dispatch to Redux for local tracking
    dispatch(analyticsSlice.actions.trackScreenView({
      screenName,
      params,
      timestamp: Date.now()
    }))
  }, [dispatch])
  
  const trackNavigationFlow = useCallback(() => {
    const history = getNavigationHistory()
    const flow = history.slice(-5).map(entry => entry.route).join(' -> ')
    
    Analytics.track('navigation_flow', {
      flow,
      steps: history.length,
      timestamp: Date.now()
    })
  }, [getNavigationHistory])
  
  return {
    trackScreenView,
    trackNavigationFlow,
    getCurrentRoute,
    getNavigationHistory
  }
}

// 5. Persistent navigation state
export function usePersistentNavigation() {
  const [isRestored, setIsRestored] = useState(false)
  const [initialState, setInitialState] = useState()
  
  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('NAVIGATION_STATE')
        if (savedState) {
          const parsedState = JSON.parse(savedState)
          
          // Validate state structure
          if (isValidNavigationState(parsedState)) {
            setInitialState(parsedState)
          }
        }
      } catch (error) {
        console.warn('Failed to restore navigation state:', error)
      } finally {
        setIsRestored(true)
      }
    }
    
    if (!isRestored) {
      restoreState()
    }
  }, [isRestored])
  
  const persistState = useCallback(
    throttle(async (state: any) => {
      try {
        await AsyncStorage.setItem('NAVIGATION_STATE', JSON.stringify(state))
      } catch (error) {
        console.warn('Failed to persist navigation state:', error)
      }
    }, 1000),
    []
  )
  
  return {
    isRestored,
    initialState,
    persistState
  }
}

// 6. Navigation guards và authorization
export function useNavigationGuards() {
  const { navigate, goBack } = useAppNavigation()
  const { user, isAuthenticated } = useAuth()
  
  const navigateWithGuard = useCallback((
    screen: string,
    params?: any,
    guards?: Array<(user?: User) => boolean | Promise<boolean>>
  ) => {
    const checkGuards = async () => {
      if (!guards || guards.length === 0) {
        navigate(screen, params)
        return
      }
      
      for (const guard of guards) {
        const canNavigate = await guard(user)
        if (!canNavigate) {
          // Handle unauthorized navigation
          presentUnauthorizedModal()
          return
        }
      }
      
      navigate(screen, params)
    }
    
    checkGuards()
  }, [navigate, user])
  
  const presentUnauthorizedModal = () => {
    navigate('Modal', {
      type: 'unauthorized',
      message: 'You need to be logged in to access this feature'
    })
  }
  
  // Common guards
  const authGuard = (user?: User) => !!user
  const premiumGuard = (user?: User) => user?.isPremium === true
  const adminGuard = (user?: User) => user?.role === 'admin'
  
  return {
    navigateWithGuard,
    guards: {
      authGuard,
      premiumGuard,
      adminGuard
    }
  }
}
```

## 6. Testing React Navigation

### Q: How do you test React Navigation flows và navigation logic?

**A:** Testing React Navigation requires comprehensive strategy covering unit tests, integration tests, và end-to-end testing để ensure reliable navigation behavior.

**Testing Philosophy và Strategy:**

Navigation testing focuses on user journeys và interaction flows rather than implementation details. Tests should verify that users can complete intended workflows và that navigation behaves correctly under various conditions.

Key principle là testing navigation behavior from user perspective - what happens when buttons are pressed, when deep links are opened, when authentication state changes. This approach ensures tests remain valuable even khi implementation details change.

**Unit Testing Approach:**

Unit tests focus on individual navigation components và their immediate behavior. Mock navigation objects provide controlled environment để test component responses to navigation events.

Navigation-related custom hooks được test in isolation với mock navigation contexts. This includes hooks mà abstract navigation logic, parameter parsing, và navigation state management.

Screen components được test với proper navigation mock setup, ensuring they handle navigation props correctly và call appropriate navigation methods based on user interactions.

**Integration Testing Strategy:**

Integration tests verify complete navigation flows work together correctly. These tests use actual navigation containers với real navigation state management but trong controlled test environment.

Multi-screen workflows được test end-to-end - ví dụ, complete booking flow từ property selection through confirmation. This ensures complex navigation sequences work reliably.

Authentication flows và conditional navigation logic are critical areas cho integration testing. Tests verify that users với different authentication states see appropriate navigation options và are redirected correctly.

**Deep Linking Test Coverage:**

Deep link testing ensures URLs properly resolve to correct screens với appropriate parameters. Both valid và invalid deep link scenarios được test để verify graceful error handling.

Authentication guards trong deep linking được test với various user authentication states. Tests ensure unauthenticated users are properly redirected và can resume their intended navigation after authentication.

URL parameter validation logic được thoroughly tested với edge cases - empty parameters, invalid formats, missing required parameters.

**Performance Testing Considerations:**

Navigation performance tests verify that transitions happen within acceptable timeframes. Memory leak tests ensure navigation doesn't accumulate unused resources over time.

Rapid navigation scenarios được test để ensure app remains stable under heavy navigation usage. This includes testing navigation cancellation và concurrent navigation requests.

**End-to-End Testing với Real Devices:**

E2E tests run on actual devices hoặc simulators để verify complete user experiences work correctly. These tests cover platform-specific navigation behaviors và system integrations.

Complex user journeys được automated trong E2E tests - complete workflows mà span multiple navigation contexts và involve system interactions như push notifications hoặc deep links.

```typescript
// 1. Testing utilities setup
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

// Mock navigation container for testing
function MockNavigationContainer({ 
  children, 
  initialRouteName = 'Home' 
}: {
  children: React.ReactNode
  initialRouteName?: string
}) {
  const Stack = createStackNavigator()
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen name="Home" component={() => children} />
        <Stack.Screen name="Details" component={MockDetailsScreen} />
        <Stack.Screen name="Profile" component={MockProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// Custom render function with navigation
function renderWithNavigation(
  component: React.ReactElement,
  { initialRouteName, navigationProps = {} } = {}
) {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    ...navigationProps
  }
  
  const mockRoute = {
    params: {},
    name: 'TestScreen',
    key: 'test-key'
  }
  
  const ComponentWithNavigation = () => 
    React.cloneElement(component, { navigation: mockNavigation, route: mockRoute })
  
  return {
    ...render(
      <MockNavigationContainer initialRouteName={initialRouteName}>
        <ComponentWithNavigation />
      </MockNavigationContainer>
    ),
    mockNavigation
  }
}

// 2. Testing navigation actions
describe('PropertyListScreen Navigation', () => {
  test('should navigate to property details when property is pressed', () => {
    const { getByTestId, mockNavigation } = renderWithNavigation(
      <PropertyListScreen />
    )
    
    const propertyCard = getByTestId('property-card-123')
    fireEvent.press(propertyCard)
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('PropertyDetails', {
      propertyId: '123',
      fromScreen: 'PropertyList'
    })
  })
  
  test('should handle back navigation correctly', () => {
    const { getByTestId, mockNavigation } = renderWithNavigation(
      <PropertyDetailsScreen />,
      {
        navigationProps: {
          canGoBack: () => true
        }
      }
    )
    
    const backButton = getByTestId('back-button')
    fireEvent.press(backButton)
    
    expect(mockNavigation.goBack).toHaveBeenCalled()
  })
  
  test('should update navigation options based on data', async () => {
    const mockProperty = { id: '123', title: 'Test Property' }
    jest.spyOn(PropertyService, 'getProperty').mockResolvedValue(mockProperty)
    
    const { mockNavigation } = renderWithNavigation(
      <PropertyDetailsScreen />,
      {
        navigationProps: {
          setOptions: jest.fn()
        }
      }
    )
    
    await waitFor(() => {
      expect(mockNavigation.setOptions).toHaveBeenCalledWith({
        title: 'Test Property',
        headerRight: expect.any(Function)
      })
    })
  })
})

// 3. Testing navigation state và deep linking
describe('Deep Linking', () => {
  test('should handle property deep link correctly', async () => {
    const mockLinking = {
      getInitialURL: jest.fn().mockResolvedValue('myapp://property/123/luxury-apartment'),
      addEventListener: jest.fn()
    }
    
    jest.mock('@react-navigation/native', () => ({
      ...jest.requireActual('@react-navigation/native'),
      Linking: mockLinking
    }))
    
    const navigationRef = createRef<NavigationContainerRef<any>>()
    
    render(
      <NavigationContainer ref={navigationRef} linking={linkingConfig}>
        <RootNavigator />
      </NavigationContainer>
    )
    
    await waitFor(() => {
      const currentRoute = navigationRef.current?.getCurrentRoute()
      expect(currentRoute?.name).toBe('PropertyDetails')
      expect(currentRoute?.params).toEqual({
        propertyId: '123',
        slug: 'luxury-apartment'
      })
    })
  })
  
  test('should handle invalid deep link gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    const mockLinking = {
      getInitialURL: jest.fn().mockResolvedValue('myapp://invalid/path'),
      addEventListener: jest.fn()
    }
    
    render(
      <NavigationContainer linking={{ ...linkingConfig, getInitialURL: mockLinking.getInitialURL }}>
        <RootNavigator />
      </NavigationContainer>
    )
    
    await waitFor(() => {
      // Should navigate to fallback screen
      expect(screen.getByTestId('home-screen')).toBeTruthy()
    })
    
    consoleSpy.mockRestore()
  })
})

// 4. Testing navigation guards và authentication flows
describe('Navigation Guards', () => {
  test('should redirect to login when accessing protected route without auth', async () => {
    const mockAuth = { isAuthenticated: false, user: null }
    jest.spyOn(AuthContext, 'useAuth').mockReturnValue(mockAuth)
    
    const { getByTestId } = render(
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    )
    
    // Try to navigate to protected route
    const navigation = getByTestId('navigation-container')
    act(() => {
      // Simulate deep link to protected route
      navigation.props.onStateChange({
        routes: [{ name: 'Profile', params: {} }],
        index: 0
      })
    })
    
    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy()
    })
  })
  
  test('should store pending navigation after login', async () => {
    const mockAsyncStorage = {
      setItem: jest.fn(),
      getItem: jest.fn()
    }
    
    jest.spyOn(AsyncStorage, 'setItem').mockImplementation(mockAsyncStorage.setItem)
    
    const { getByTestId } = renderWithNavigation(<LoginScreen />)
    
    // Simulate navigation to login with pending deep link
    fireEvent.press(getByTestId('login-button'))
    
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'PENDING_DEEP_LINK',
      expect.any(String)
    )
  })
})

// 5. Integration testing with Redux
describe('Navigation Redux Integration', () => {
  test('should update Redux state on navigation changes', () => {
    const store = createMockStore({
      navigation: {
        currentRoute: 'Home',
        navigationHistory: []
      }
    })
    
    const { getByTestId } = render(
      <Provider store={store}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </Provider>
    )
    
    // Navigate to different screen
    const navigation = getByTestId('navigation-container')
    act(() => {
      navigation.props.onStateChange({
        routes: [{ name: 'Profile', params: {} }],
        index: 0
      })
    })
    
    const actions = store.getActions()
    expect(actions).toContainEqual({
      type: 'navigation/navigateToScreen',
      payload: {
        routeName: 'Profile',
        params: {}
      }
    })
  })
})

// 6. Performance testing
describe('Navigation Performance', () => {
  test('should not cause memory leaks on rapid navigation', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    const { getByTestId, mockNavigation } = renderWithNavigation(
      <PropertyListScreen />
    )
    
    // Simulate rapid navigation
    for (let i = 0; i < 100; i++) {
      mockNavigation.navigate('PropertyDetails', { propertyId: `${i}` })
      mockNavigation.goBack()
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    await waitFor(() => {
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })
  
  test('should render screens within performance budget', async () => {
    const startTime = performance.now()
    
    renderWithNavigation(<PropertyListScreen />)
    
    await waitFor(() => {
      expect(screen.getByTestId('property-list')).toBeTruthy()
    })
    
    const renderTime = performance.now() - startTime
    expect(renderTime).toBeLessThan(100) // Should render within 100ms
  })
})

// 7. E2E Testing với Detox
describe('Navigation E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp()
  })
  
  test('complete property booking flow', async () => {
    // Navigate to property list
    await element(by.id('tab-home')).tap()
    await expect(element(by.id('property-list'))).toBeVisible()
    
    // Select first property
    await element(by.id('property-card-0')).tap()
    await expect(element(by.id('property-details'))).toBeVisible()
    
    // Start booking flow
    await element(by.id('book-now-button')).tap()
    await expect(element(by.id('date-selection'))).toBeVisible()
    
    // Select dates
    await element(by.id('check-in-date')).tap()
    await element(by.text('15')).tap()
    await element(by.id('check-out-date')).tap()
    await element(by.text('20')).tap()
    await element(by.id('confirm-dates')).tap()
    
    // Fill guest details
    await expect(element(by.id('guest-details'))).toBeVisible()
    await element(by.id('guest-count-input')).typeText('2')
    await element(by.id('continue-button')).tap()
    
    // Payment method
    await expect(element(by.id('payment-method'))).toBeVisible()
    await element(by.id('credit-card-option')).tap()
    await element(by.id('card-number')).typeText('4242424242424242')
    await element(by.id('continue-button')).tap()
    
    // Review and confirm
    await expect(element(by.id('booking-review'))).toBeVisible()
    await element(by.id('confirm-booking')).tap()
    
    // Booking confirmation
    await waitFor(element(by.id('booking-confirmation'))).toBeVisible().withTimeout(10000)
    await expect(element(by.text('Booking Confirmed'))).toBeVisible()
  })
  
  test('navigation back stack management', async () => {
    // Start from home
    await element(by.id('tab-home')).tap()
    
    // Navigate through multiple screens
    await element(by.id('property-card-0')).tap()
    await element(by.id('view-photos-button')).tap()
    await element(by.id('photo-0')).tap()
    
    // Navigate back through stack
    await device.pressBack() // Close photo viewer
    await expect(element(by.id('photo-gallery'))).toBeVisible()
    
    await device.pressBack() // Back to property details
    await expect(element(by.id('property-details'))).toBeVisible()
    
    await device.pressBack() // Back to property list
    await expect(element(by.id('property-list'))).toBeVisible()
  })
})
```

## 7. Advanced Customization & Animations

### Q: How do you create custom navigators và complex animations trong React Navigation?

**A:** Creating custom navigators và complex animations requires deep understanding của React Navigation's internal architecture và animation system.

**Custom Navigator Architecture:**

Custom navigators extend React Navigation's core functionality để provide specialized navigation behaviors không available với standard navigators. This involves understanding navigation builder patterns, router configurations, và view rendering logic.

Key principle là building custom navigators mà integrate seamlessly với existing React Navigation ecosystem. Custom navigators should support standard navigation props, screen options, và lifecycle events just như built-in navigators.

Architecture considerations include state management, screen mounting/unmounting logic, và compatibility với navigation features như deep linking và state persistence.

**Animation System Understanding:**

React Navigation's animation system builds on React Native's Animated API và gesture handling. Custom animations require understanding animation interpolation, gesture recognition, và performance optimization techniques.

Critical concept là animation interpolators mà define how screen transitions progress. These interpolators control everything từ position và opacity to more complex transformations như scaling và rotation.

Performance is paramount trong navigation animations - they must run at 60 FPS để provide smooth user experience. This requires using native driver khi possible và optimizing animation calculations.

**Advanced Transition Patterns:**

Complex transitions involve coordinating multiple animation properties simultaneously. Ví dụ, shared element transitions require precise timing coordination giữa outgoing và incoming screens.

Custom gesture handling enables unique interaction patterns như swipe-based navigation với custom thresholds và physics. This requires integrating với React Native Gesture Handler để achieve native-feeling interactions.

Screen transitions can include custom overlay effects, background animations, và coordinated header animations. These create cohesive visual experiences mà match app's design language.

**Modal Presentation Customization:**

Custom modal presentations enable unique UX patterns như bottom sheets, popup overlays, và full-screen takeovers. Each presentation style requires different animation approaches và gesture handling.

Modal dismissal behavior needs careful consideration - supporting both programmatic dismissal và user gestures. This includes handling edge cases như preventing accidental dismissals during critical operations.

Stack management trong custom modal presentations ensures proper screen lifecycle management và memory cleanup khi modals are dismissed.

**Performance Optimization Strategies:**

Custom animations must be optimized để avoid performance bottlenecks. This includes using native driver capabilities, minimizing JavaScript bridge communication, và efficient rendering techniques.

Animation caching và reuse strategies prevent redundant calculations during rapid navigation scenarios. Pre-calculating animation values và reusing animation instances improve performance considerably.

Memory management considerations ensure custom animators don't create memory leaks through retained animation references hoặc improper cleanup procedures.

```typescript
// 1. Custom Navigator Implementation
import { useNavigationBuilder, createNavigatorFactory, StackRouter } from '@react-navigation/native'
import { StackView } from '@react-navigation/stack'

interface CustomStackNavigatorProps {
  initialRouteName?: string
  children: React.ReactNode
  screenOptions?: any
  customTransition?: 'slide' | 'fade' | 'scale' | 'flip'
}

function CustomStackNavigator({
  initialRouteName,
  children,
  screenOptions = {},
  customTransition = 'slide'
}: CustomStackNavigatorProps) {
  const { state, navigation, descriptors } = useNavigationBuilder(StackRouter, {
    children,
    screenOptions,
    initialRouteName
  })
  
  // Custom transition configurations
  const transitionConfigs = {
    slide: {
      gestureDirection: 'horizontal',
      cardStyleInterpolator: ({ current, layouts }: any) => ({
        cardStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width, 0]
              })
            }
          ]
        }
      })
    },
    
    fade: {
      cardStyleInterpolator: ({ current }: any) => ({
        cardStyle: {
          opacity: current.progress
        }
      })
    },
    
    scale: {
      cardStyleInterpolator: ({ current }: any) => ({
        cardStyle: {
          transform: [
            {
              scale: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1]
              })
            }
          ],
          opacity: current.progress
        }
      })
    },
    
    flip: {
      cardStyleInterpolator: ({ current, layouts }: any) => ({
        cardStyle: {
          backfaceVisibility: 'hidden',
          transform: [
            {
              perspective: 1000
            },
            {
              rotateY: current.progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: ['180deg', '90deg', '0deg']
              })
            }
          ]
        }
      })
    }
  }
  
  return (
    <StackView
      state={state}
      navigation={navigation}
      descriptors={descriptors}
      {...transitionConfigs[customTransition]}
    />
  )
}

const createCustomStackNavigator = createNavigatorFactory(CustomStackNavigator)

// Usage
function AppNavigator() {
  const CustomStack = createCustomStackNavigator()
  
  return (
    <CustomStack.Navigator customTransition="scale">
      <CustomStack.Screen name="Home" component={HomeScreen} />
      <CustomStack.Screen name="Details" component={DetailsScreen} />
    </CustomStack.Navigator>
  )
}

// 2. Advanced Custom Transitions với Shared Elements
interface SharedElementTransitionProps {
  current: Animated.AnimatedAddition
  next?: Animated.AnimatedAddition
  layouts: {
    screen: { width: number; height: number }
  }
  sharedElements?: Array<{
    id: string
    sourceRect: { x: number; y: number; width: number; height: number }
    targetRect: { x: number; y: number; width: number; height: number }
  }>
}

const SharedElementTransition = {
  cardStyleInterpolator: ({ 
    current, 
    next, 
    layouts, 
    sharedElements = [] 
  }: SharedElementTransitionProps) => {
    const progress = Animated.add(
      current.progress,
      next ? next.progress : 0
    )
    
    return {
      cardStyle: {
        transform: [
          {
            translateX: Animated.multiply(
              progress.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [layouts.screen.width, 0, -layouts.screen.width * 0.3]
              }),
              1
            )
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0.9, 1, 1.1]
            })
          }
        ],
        opacity: progress.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0, 1, 0.3]
        })
      },
      overlayStyle: {
        opacity: progress.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0, 0.5, 0.8]
        })
      }
    }
  },
  
  // Custom header animation
  headerStyleInterpolator: ({ current, layouts }: any) => ({
    leftLabelStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1]
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0]
          })
        }
      ]
    },
    titleStyle: {
      opacity: current.progress,
      transform: [
        {
          translateY: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }
      ]
    },
    rightButtonStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [0, 0, 1]
      })
    }
  })
}

// 3. Custom Tab Bar với Advanced Animations
function AnimatedTabBar({ state, descriptors, navigation }: any) {
  const [tabPositions] = useState(() => 
    state.routes.map(() => new Animated.Value(0))
  )
  const [indicatorPosition] = useState(new Animated.Value(0))
  const [indicatorWidth] = useState(new Animated.Value(0))
  
  useEffect(() => {
    // Animate indicator position
    Animated.spring(indicatorPosition, {
      toValue: state.index,
      useNativeDriver: false,
      tension: 100,
      friction: 8
    }).start()
    
    // Animate tab positions
    tabPositions.forEach((position, index) => {
      Animated.spring(position, {
        toValue: index === state.index ? 1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8
      }).start()
    })
  }, [state.index])
  
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {/* Animated indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              left: indicatorPosition.interpolate({
                inputRange: state.routes.map((_, i) => i),
                outputRange: state.routes.map((_, i) => `${(100 / state.routes.length) * i}%`)
              }),
              width: `${100 / state.routes.length}%`
            }
          ]}
        />
        
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true
            })
            
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }
          
          return (
            <Animated.View
              key={route.key}
              style={[
                styles.tabItem,
                {
                  transform: [
                    {
                      scale: tabPositions[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1.1]
                      })
                    },
                    {
                      translateY: tabPositions[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -2]
                      })
                    }
                  ]
                }
              ]}
            >
              <TouchableOpacity
                onPress={onPress}
                style={styles.tabButton}
              >
                <Animated.View
                  style={{
                    opacity: tabPositions[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1]
                    })
                  }}
                >
                  <TabIcon
                    route={route}
                    focused={isFocused}
                    color={isFocused ? '#007AFF' : '#8E8E93'}
                  />
                </Animated.View>
                
                <Animated.Text
                  style={[
                    styles.tabLabel,
                    {
                      color: tabPositions[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#8E8E93', '#007AFF']
                      }),
                      transform: [
                        {
                          scale: tabPositions[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  {options.tabBarLabel || route.name}
                </Animated.Text>
              </TouchableOpacity>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}

// 4. Gesture-based Custom Navigator
function GestureStackNavigator() {
  const { state, navigation, descriptors } = useNavigationBuilder(StackRouter, {
    children,
    screenOptions: {
      gestureEnabled: true,
      gestureResponseDistance: 50
    }
  })
  
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet'
      // Handle gesture start
    })
    .onUpdate((event) => {
      'worklet'
      if (event.translationX > 0 && navigation.canGoBack()) {
        // Update transition based on gesture
        const progress = Math.min(event.translationX / 300, 1)
        // Apply progress to card transform
      }
    })
    .onEnd((event) => {
      'worklet'
      if (event.translationX > 150 && navigation.canGoBack()) {
        // Complete navigation
        runOnJS(navigation.goBack)()
      } else {
        // Cancel navigation
        // Reset card position
      }
    })
  
  return (
    <GestureDetector gesture={panGesture}>
      <StackView
        state={state}
        navigation={navigation}
        descriptors={descriptors}
        cardStyleInterpolator={GestureCardStyleInterpolator}
      />
    </GestureDetector>
  )
}

// 5. Advanced Modal Presentations
const ModalPresentationStyles = {
  slideUp: {
    cardStyleInterpolator: ({ current, layouts }: any) => ({
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0]
            })
          }
        ]
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5]
        }),
        backgroundColor: 'black'
      }
    }),
    gestureDirection: 'vertical',
    gestureResponseDistance: 100
  },
  
  scaleFromCenter: {
    cardStyleInterpolator: ({ current }: any) => ({
      cardStyle: {
        transform: [
          {
            scale: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1]
            })
          }
        ],
        opacity: current.progress,
        backgroundColor: 'white',
        borderRadius: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0]
        })
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5]
        }),
        backgroundColor: 'black'
      }
    })
  },
  
  bottomSheet: {
    cardStyleInterpolator: ({ current, layouts }: any) => {
      const translateY = current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [layouts.screen.height * 0.3, 0]
      })
      
      return {
        cardStyle: {
          transform: [{ translateY }],
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowOpacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.3]
          }),
          shadowOffset: {
            width: 0,
            height: -2
          },
          shadowRadius: 10,
          elevation: 5
        },
        overlayStyle: {
          opacity: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.3]
          }),
          backgroundColor: 'black'
        }
      }
    },
    gestureDirection: 'vertical',
    gestureResponseDistance: 100
  }
}
```

## 8. Troubleshooting & Debugging

### Q: Common React Navigation issues và debugging strategies?

**A:** Troubleshooting React Navigation issues requires systematic approach combining debugging tools, common issue patterns, và preventive strategies.

**Common Issue Patterns:**

Navigation issues typically fall into predictable categories - state management problems, parameter passing errors, lifecycle issues, và performance degradation. Understanding these patterns helps quickly identify root causes.

Most frequent issues involve navigation object availability, parameter type mismatches, và memory leaks từ improper event listener cleanup. These issues often manifest differently across development và production environments.

Screen mounting/unmounting timing issues create subtle bugs mà are difficult to reproduce. Components might try to access navigation objects sau unmounting hoặc before mounting completes.

**Debugging Strategy Framework:**

Systematic debugging starts với enabling navigation state logging để understand current navigation structure và state transitions. This reveals whether issues stem từ navigation logic hoặc application logic.

Network và performance monitoring during navigation events helps identify bottlenecks. Slow API calls during screen transitions create user experience issues mà appear like navigation problems.

Device-specific testing reveals platform differences và edge cases. iOS và Android handle navigation gestures, memory management, và lifecycle events differently.

**Navigation State Analysis:**

Understanding navigation state structure enables debugging complex navigation flows. State inspection tools reveal current navigation hierarchy, parameter values, và routing information.

Navigation state validation helps identify corrupted states hoặc invalid navigation configurations. Malformed navigation states cause crashes hoặc unexpected behavior.

Historical navigation analysis through state change logging reveals patterns trong problematic user flows. This data helps identify specific navigation sequences mà cause issues.

**Performance Issue Investigation:**

Navigation performance problems often relate to excessive re-rendering, memory leaks, hoặc heavy computations during transitions. Profiling tools help identify specific bottlenecks.

Memory usage monitoring during navigation reveals leaks từ improper cleanup. Navigation-heavy usage patterns expose memory management issues mà don't appear during casual testing.

Bundle analysis helps identify code splitting issues mà affect navigation performance. Large bundles cause slow screen loading times mà users perceive as navigation problems.

**Preventive Development Practices:**

Error boundaries around navigation components provide graceful failure handling và useful error reporting. This prevents navigation errors từ crashing entire application.

Comprehensive TypeScript typing catches parameter mismatches và navigation errors during development. Strong typing prevents many runtime navigation issues.

Testing strategies focus on navigation flows rather than individual screens. Integration tests catch navigation regressions mà unit tests miss.

```typescript
// 1. Navigation State Debugging
class NavigationDebugger {
  static enableDebugMode() {
    if (__DEV__) {
      // Enable navigation state logging
      const originalDispatch = console.log
      console.log = (...args) => {
        if (args[0]?.includes?.('@react-navigation')) {
          console.group('🧭 Navigation Action')
          console.log('Action:', args[0])
          console.log('State:', args[1])
          console.groupEnd()
        }
        originalDispatch.apply(console, args)
      }
    }
  }
  
  static logNavigationTree(state: any, level = 0) {
    const indent = '  '.repeat(level)
    console.log(`${indent}${state.routeNames?.[state.index] || state.routes?.[state.index]?.name}`)
    
    if (state.routes) {
      state.routes.forEach((route: any, index: number) => {
        if (route.state) {
          this.logNavigationTree(route.state, level + 1)
        } else {
          console.log(`${indent}  ${route.name}`)
        }
      })
    }
  }
  
  static validateNavigationStructure(navigation: any) {
    const issues: string[] = []
    
    // Check for common navigation issues
    if (!navigation) {
      issues.push('Navigation object is undefined')
    }
    
    if (navigation && typeof navigation.navigate !== 'function') {
      issues.push('Navigation.navigate is not a function')
    }
    
    // Check navigation state
    const state = navigation.getState?.()
    if (state && !state.routes) {
      issues.push('Navigation state is malformed')
    }
    
    return {
      isValid: issues.length === 0,
      issues
    }
  }
}

// 2. Common Issue Fixes
class NavigationIssueResolver {
  // Fix: "Cannot read property 'navigate' of undefined"
  static createSafeNavigation(navigation: any) {
    return new Proxy(navigation || {}, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return (...args: any[]) => {
            try {
              return target[prop](...args)
            } catch (error) {
              console.error(`Navigation error in ${String(prop)}:`, error)
              // Fallback behavior
              if (prop === 'navigate') {
                console.warn('Navigation failed, falling back to safe navigation')
                return
              }
              throw error
            }
          }
        }
        return target[prop]
      }
    })
  }
  
  // Fix: Navigation params not updating
  static useRefreshingRoute<T>() {
    const route = useRoute<T>()
    const [params, setParams] = useState(route.params)
    
    useEffect(() => {
      setParams(route.params)
    }, [route.params])
    
    return { ...route, params }
  }
  
  // Fix: Screen not re-rendering on focus
  static useFocusRefresh(callback: () => void) {
    const navigation = useNavigation()
    
    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', callback)
      return unsubscribe
    }, [navigation, callback])
  }
  
  // Fix: Memory leaks from navigation listeners
  static useNavigationListener(
    event: string, 
    callback: (e: any) => void
  ) {
    const navigation = useNavigation()
    
    useEffect(() => {
      const unsubscribe = navigation.addListener(event, callback)
      
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      }
    }, [navigation, event, callback])
  }
}

// 3. Performance Debugging
class NavigationPerformanceMonitor {
  private static navigationTimes = new Map<string, number>()
  
  static startTiming(routeName: string) {
    this.navigationTimes.set(routeName, Date.now())
  }
  
  static endTiming(routeName: string) {
    const startTime = this.navigationTimes.get(routeName)
    if (startTime) {
      const duration = Date.now() - startTime
      console.log(`🕐 Navigation to ${routeName}: ${duration}ms`)
      
      if (duration > 300) {
        console.warn(`⚠️ Slow navigation detected: ${routeName} took ${duration}ms`)
      }
      
      this.navigationTimes.delete(routeName)
      
      // Report to analytics
      if (global.analytics) {
        global.analytics.track('navigation_performance', {
          route: routeName,
          duration
        })
      }
    }
  }
  
  static measureScreenRender(ScreenComponent: React.ComponentType<any>) {
    return React.forwardRef<any, any>((props, ref) => {
      const startTime = useRef(Date.now())
      
      useEffect(() => {
        const renderTime = Date.now() - startTime.current
        console.log(`📊 ${ScreenComponent.name} render time: ${renderTime}ms`)
        
        if (renderTime > 100) {
          console.warn(`⚠️ Slow render: ${ScreenComponent.name} took ${renderTime}ms`)
        }
      }, [])
      
      return <ScreenComponent {...props} ref={ref} />
    })
  }
}

// 4. Deep Link Debugging
class DeepLinkDebugger {
  static debugLinkingConfig(config: any) {
    console.group('🔗 Deep Link Configuration')
    this.logLinkingTree(config.screens, '')
    console.groupEnd()
  }
  
  private static logLinkingTree(screens: any, prefix: string) {
    Object.entries(screens).forEach(([key, value]: [string, any]) => {
      const path = typeof value === 'string' ? value : value.path
      console.log(`${prefix}${key}: ${path || 'No path'}`)
      
      if (value.screens) {
        this.logLinkingTree(value.screens, `${prefix}  `)
      }
    })
  }
  
  static validateDeepLink(url: string, config: any): DeepLinkValidationResult {
    try {
      const parsedUrl = new URL(url)
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
      
      const result = this.matchRoute(pathSegments, config.screens)
      
      return {
        isValid: result.isValid,
        matchedRoute: result.route,
        params: result.params,
        errors: result.errors
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Invalid URL format: ${error.message}`]
      }
    }
  }
  
  private static matchRoute(segments: string[], screens: any, path: string = ''): any {
    for (const [screenName, config] of Object.entries(screens)) {
      const screenConfig = typeof config === 'string' 
        ? { path: config } 
        : config as any
      
      const screenPath = screenConfig.path || screenName.toLowerCase()
      const pathPattern = screenPath.split('/')
      
      if (this.matchesPattern(segments, pathPattern)) {
        return {
          isValid: true,
          route: screenName,
          params: this.extractParams(segments, pathPattern),
          errors: []
        }
      }
      
      // Check nested screens
      if (screenConfig.screens) {
        const nestedResult = this.matchRoute(
          segments, 
          screenConfig.screens, 
          `${path}/${screenName}`
        )
        if (nestedResult.isValid) {
          return nestedResult
        }
      }
    }
    
    return {
      isValid: false,
      errors: [`No matching route found for path: /${segments.join('/')}`]
    }
  }
  
  private static matchesPattern(segments: string[], pattern: string[]): boolean {
    if (segments.length !== pattern.length) {
      return false
    }
    
    return pattern.every((patternSegment, index) => {
      if (patternSegment.startsWith(':')) {
        return true // Parameter segment matches any value
      }
      return patternSegment === segments[index]
    })
  }
  
  private static extractParams(segments: string[], pattern: string[]): Record<string, string> {
    const params: Record<string, string> = {}
    
    pattern.forEach((patternSegment, index) => {
      if (patternSegment.startsWith(':')) {
        const paramName = patternSegment.substring(1).replace('?', '')
        params[paramName] = segments[index]
      }
    })
    
    return params
  }
}

// 5. Error Boundary for Navigation
class NavigationErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation Error Boundary caught an error:', error, errorInfo)
    
    // Report to crash analytics
    if (global.crashlytics) {
      global.crashlytics.recordError(error)
    }
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultNavigationErrorScreen
      return <FallbackComponent error={this.state.error} />
    }
    
    return this.props.children
  }
}

// Usage
function App() {
  return (
    <NavigationErrorBoundary>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </NavigationErrorBoundary>
  )
}

// 6. Development Tools
class NavigationDevTools {
  static createDebugNavigator(Navigator: any) {
    return (props: any) => {
      const [showDebugInfo, setShowDebugInfo] = useState(__DEV__)
      
      return (
        <View style={{ flex: 1 }}>
          <Navigator {...props} />
          
          {showDebugInfo && (
            <View style={styles.debugOverlay}>
              <NavigationDebugInfo />
              <TouchableOpacity
                style={styles.debugToggle}
                onPress={() => setShowDebugInfo(false)}
              >
                <Text>Hide Debug</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {!showDebugInfo && __DEV__ && (
            <TouchableOpacity
              style={styles.debugShowButton}
              onPress={() => setShowDebugInfo(true)}
            >
              <Text>🐛</Text>
            </TouchableOpacity>
          )}
        </View>
      )
    }
  }
}

interface DeepLinkValidationResult {
  isValid: boolean
  matchedRoute?: string
  params?: Record<string, string>
  errors?: string[]
}
```

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive React Navigation interview questions for senior level", "status": "completed", "activeForm": "Creating comprehensive React Navigation interview questions"}]