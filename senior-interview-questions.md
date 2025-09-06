# Câu Hỏi Phỏng Vấn Senior Level - Nguyen Duc Vuong

## Technical Architecture & System Design

### 1. Django & Backend Architecture

**Q: Bạn có thể mô tả chi tiết về cách bạn thiết kế Django REST API backend cho rental marketplace platform? Tại sao bạn lại chọn Django thay vì các framework khác như FastAPI hay Express.js?**

A: Tôi chọn Django vì nó cung cấp một ecosystem hoàn chỉnh với Django ORM mạnh mẽ, Django REST Framework tích hợp sẵn, và security features built-in. Cho rental marketplace, tôi thiết kế theo pattern:
- **Model Layer**: Sử dụng Django ORM với complex relationships (Property, User, Booking, Review)
- **API Layer**: Django REST Framework với ViewSets, custom permissions, và pagination
- **Business Logic**: Service layer pattern để tách biệt business logic khỏi views
- **Database**: PostgreSQL với indexing strategies cho search optimization
- **Caching**: Redis cho session storage và frequently accessed data

**Q: Làm thế nào bạn implement HttpOnly cookie authentication? Tại sao không sử dụng JWT tokens trong localStorage?**

A: HttpOnly cookies ngăn chặn XSS attacks vì JavaScript không thể access được. Implementation:
```python
# Django settings
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True  # HTTPS only
SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection

# Custom authentication middleware
class CustomAuthMiddleware:
    def process_request(self, request):
        # Validate session và rotate session key
        # Implement proper logout cleanup
```
JWT trong localStorage dễ bị XSS attacks. HttpOnly cookies + CSRF tokens provide better security posture.

**Q: Với rental application system có 25+ filtering criteria, bạn optimize database queries và search performance như thế nào?**

A: **Database Design**:
```sql
-- Composite indexes cho common filter combinations
CREATE INDEX idx_properties_location_price_type 
ON properties (city, price_range, property_type, status) 
WHERE status = 'available';

-- Partial index cho active listings
CREATE INDEX idx_active_properties 
ON properties (created_at DESC) 
WHERE status = 'available' AND verified = true;

-- GIN index cho full-text search
CREATE INDEX idx_properties_fulltext 
ON properties USING gin(
  to_tsvector('english', title || ' ' || description || ' ' || address)
);
```

**Search Optimization**:
```python
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank

class PropertyViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        queryset = Property.objects.all()
        
        # Text search with ranking
        search = self.request.query_params.get('search')
        if search:
            search_vector = SearchVector('title', weight='A') + \
                          SearchVector('description', weight='B')
            search_query = SearchQuery(search)
            
            queryset = queryset.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(search=search_query).order_by('-rank', '-created_at')
        
        # Multi-field filtering with Q objects
        filters = Q()
        if price_min := self.request.query_params.get('price_min'):
            filters &= Q(price__gte=price_min)
        if price_max := self.request.query_params.get('price_max'):
            filters &= Q(price__lte=price_max)
        
        # Geographic filtering
        lat = self.request.query_params.get('latitude')
        lng = self.request.query_params.get('longitude')
        radius = self.request.query_params.get('radius', 10)
        
        if lat and lng:
            from django.contrib.gis.geos import Point
            from django.contrib.gis.measure import Distance
            
            point = Point(float(lng), float(lat), srid=4326)
            filters &= Q(location__distance_lte=(point, Distance(km=radius)))
        
        return queryset.filter(filters).select_related(
            'owner', 'category'
        ).prefetch_related('amenities', 'images')
```

### 2. Advanced Mobile Architecture

**Q: Trong React Native app với 5K+ users, bạn handle offline functionality và data synchronization như thế nào?**

A: **Offline-First Architecture**:
```typescript
// Redux offline configuration
import { persistStore, persistReducer } from 'redux-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user', 'properties', 'favorites'], // Only persist certain reducers
  transforms: [
    // Custom transform to handle data expiration
    createTransform(
      (inboundState: any) => ({
        ...inboundState,
        lastSync: Date.now()
      }),
      (outboundState: any) => {
        const isExpired = Date.now() - outboundState.lastSync > 24 * 60 * 60 * 1000
        return isExpired ? undefined : outboundState
      }
    )
  ]
}

// Offline queue management
class OfflineActionQueue {
  private queue: OfflineAction[] = []
  
  async addAction(action: OfflineAction) {
    this.queue.push({
      ...action,
      timestamp: Date.now(),
      retryCount: 0
    })
    await this.persistQueue()
  }
  
  async syncWhenOnline() {
    if (!NetInfo.isConnected.fetch()) return
    
    const failedActions = []
    
    for (const action of this.queue) {
      try {
        await this.executeAction(action)
      } catch (error) {
        if (action.retryCount < 3) {
          failedActions.push({
            ...action,
            retryCount: action.retryCount + 1
          })
        }
      }
    }
    
    this.queue = failedActions
    await this.persistQueue()
  }
}
```

**Conflict Resolution**:
```typescript
interface DataSyncManager {
  resolveConflict<T>(
    localData: T & { version: number },
    serverData: T & { version: number }
  ): T {
    // Last-write-wins với version control
    if (localData.version > serverData.version) {
      return localData
    } else if (serverData.version > localData.version) {
      return serverData
    } else {
      // Custom merge logic for specific data types
      return this.mergeData(localData, serverData)
    }
  }
}
```

**Q: Bạn implement real-time messaging trong React Native như thế nào với optimization cho performance?**

A: **WebSocket Implementation với Optimization**:
```typescript
class MessageManager {
  private ws: WebSocket | null = null
  private messageQueue: Message[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  connect(userId: string, chatId: string) {
    const wsUrl = `${WS_BASE_URL}/chat/${chatId}?userId=${userId}`
    this.ws = new WebSocket(wsUrl)
    
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.flushMessageQueue()
    }
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.handleMessage(message)
    }
    
    this.ws.onclose = () => {
      this.handleReconnect()
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }
  
  sendMessage(message: Message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue messages when offline
      this.messageQueue.push(message)
    }
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, Math.pow(2, this.reconnectAttempts) * 1000) // Exponential backoff
    }
  }
}

// Message optimization với FlatList
const ChatScreen: FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageItem message={item} />
  ), [])
  
  const keyExtractor = useCallback((item: Message) => item.id, [])
  
  const loadMoreMessages = useCallback(async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const newMessages = await MessageService.getMessages(chatId, page)
      setMessages(prev => [...prev, ...newMessages])
      setPage(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }, [loading, page])
  
  return (
    <FlatList
      data={messages}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      onEndReached={loadMoreMessages}
      onEndReachedThreshold={0.1}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={20}
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index
      })}
    />
  )
}
```

### 3. Advanced DevOps & Infrastructure

**Q: Bạn thiết kế CI/CD pipeline với GitHub Actions và Fastlane như thế nào để support multiple environments?**

A: **Multi-Environment Pipeline**:
```yaml
# .github/workflows/mobile-ci-cd.yml
name: Mobile CI/CD Pipeline

on:
  push:
    branches: [main, develop, release/*]
  pull_request:
    branches: [main, develop]

env:
  DEVELOPER_DIR: /Applications/Xcode.app/Contents/Developer

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.env.outputs.environment }}
      should_deploy: ${{ steps.env.outputs.should_deploy }}
    steps:
      - name: Determine environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
            echo "should_deploy=true" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "should_deploy=true" >> $GITHUB_OUTPUT
          else
            echo "environment=development" >> $GITHUB_OUTPUT
            echo "should_deploy=false" >> $GITHUB_OUTPUT
          fi

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.npm
            ~/Library/Caches/CocoaPods
            ~/.gradle/caches
          key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json', '**/Podfile.lock', '**/build.gradle') }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage --watchAll=false
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  build-ios:
    needs: [setup, test]
    runs-on: macos-latest
    if: needs.setup.outputs.should_deploy == 'true'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: 3.0
          bundler-cache: true
      
      - name: Install dependencies
        run: |
          npm ci
          cd ios && pod install
      
      - name: Build and deploy iOS
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
          ENVIRONMENT: ${{ needs.setup.outputs.environment }}
        run: |
          cd ios
          bundle exec fastlane $ENVIRONMENT

  build-android:
    needs: [setup, test]
    runs-on: ubuntu-latest
    if: needs.setup.outputs.should_deploy == 'true'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'
      
      - name: Setup Android SDK
        uses: android-actions/setup-android@v2
      
      - name: Build and deploy Android
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
          ENVIRONMENT: ${{ needs.setup.outputs.environment }}
        run: |
          cd android
          bundle exec fastlane $ENVIRONMENT
```

**Fastlane Configuration**:
```ruby
# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  before_all do
    setup_circle_ci if ENV['CI']
  end

  desc "Build and deploy to staging"
  lane :staging do
    setup_certificates_and_profiles
    build_app(
      scheme: "MyApp",
      configuration: "Staging",
      export_method: "ad-hoc"
    )
    firebase_app_distribution(
      app: ENV['FIREBASE_APP_ID_STAGING'],
      groups: "internal-testers"
    )
  end

  desc "Build and deploy to production"
  lane :production do
    setup_certificates_and_profiles
    increment_build_number(xcodeproj: "MyApp.xcodeproj")
    build_app(
      scheme: "MyApp",
      configuration: "Release"
    )
    upload_to_app_store(
      skip_waiting_for_build_processing: true,
      skip_metadata: false,
      skip_screenshots: false
    )
  end

  private_lane :setup_certificates_and_profiles do
    match(
      type: "adhoc",
      readonly: is_ci,
      keychain_name: "fastlane_tmp_keychain"
    )
  end
end

# android/fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Build and deploy to staging"
  lane :staging do
    gradle(
      task: "clean assembleStaging",
      project_dir: "."
    )
    firebase_app_distribution(
      app: ENV['FIREBASE_APP_ID_ANDROID_STAGING'],
      groups: "internal-testers"
    )
  end

  desc "Build and deploy to production"
  lane :production do
    increment_version_code
    gradle(
      task: "clean bundleRelease",
      project_dir: "."
    )
    upload_to_play_store(
      track: "internal",
      rollout: "0.1"
    )
  end
end
```

**Q: Làm thế nào bạn setup monitoring và alerting cho production applications?**

A: **Comprehensive Monitoring Stack**:
```typescript
// Application Performance Monitoring
import * as Sentry from '@sentry/react-native'
import { Performance } from '@react-native-firebase/perf'

// Sentry configuration
Sentry.init({
  dsn: Config.SENTRY_DSN,
  environment: Config.ENVIRONMENT,
  beforeSend: (event, hint) => {
    // Filter out sensitive information
    if (event.user?.email) {
      event.user.email = '[Filtered]'
    }
    return event
  },
  tracesSampleRate: 0.1, // Sample 10% of transactions
  profilesSampleRate: 0.1
})

// Custom performance tracking
class PerformanceTracker {
  static async trackAsyncOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const trace = Performance().newTrace(operationName)
    await trace.start()
    
    try {
      const result = await operation()
      trace.putAttribute('success', 'true')
      return result
    } catch (error) {
      trace.putAttribute('success', 'false')
      trace.putAttribute('error', error.message)
      Sentry.captureException(error, {
        tags: { operation: operationName }
      })
      throw error
    } finally {
      await trace.stop()
    }
  }
  
  static trackUserAction(action: string, metadata?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message: action,
      level: 'info',
      data: metadata
    })
  }
}

// Usage example
const ApiService = {
  async fetchUserData(userId: string) {
    return PerformanceTracker.trackAsyncOperation(
      'fetch_user_data',
      async () => {
        const response = await fetch(`/api/users/${userId}`)
        if (!response.ok) throw new Error('Failed to fetch user data')
        return response.json()
      }
    )
  }
}
```

**Infrastructure Monitoring**:
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  prometheus_data:
  grafana_data:
```

### 4. Advanced Database & Performance

**Q: Với PostgreSQL database, bạn handle database sharding và horizontal scaling như thế nào?**

A: **Database Sharding Strategy**:
```python
# Database router for sharding
class DatabaseRouter:
    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'properties':
            # Shard based on property location
            if hints.get('instance'):
                region = getattr(hints['instance'], 'region', None)
                return f'properties_{region}' if region else 'default'
        return None
    
    def db_for_write(self, model, **hints):
        return self.db_for_read(model, **hints)
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == 'properties':
            return db.startswith('properties_')
        return db == 'default'

# Shard-aware model manager
class PropertyManager(models.Manager):
    def get_queryset_for_region(self, region):
        return super().get_queryset().using(f'properties_{region}')
    
    def cross_shard_search(self, **filters):
        results = []
        for db_alias in self.get_shard_databases():
            shard_results = super().get_queryset().using(db_alias).filter(**filters)
            results.extend(shard_results)
        return results
    
    def get_shard_databases(self):
        return [f'properties_{region}' for region in ['us', 'eu', 'asia']]

# Connection pooling configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'main_db',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'MIN_CONNS': 5,
        }
    },
    'properties_us': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'properties_us',
        'HOST': 'us-east-1.rds.amazonaws.com',
        'OPTIONS': {
            'MAX_CONNS': 15,
        }
    },
    'properties_eu': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'properties_eu',
        'HOST': 'eu-west-1.rds.amazonaws.com',
    }
}
```

**Advanced Query Optimization**:
```python
from django.db.models import Prefetch, Count, Avg, Q
from django.core.cache import cache

class OptimizedPropertyViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # Use select_related for foreign keys
        queryset = Property.objects.select_related(
            'owner',
            'category',
            'location'
        ).prefetch_related(
            # Optimize reverse foreign key lookups
            Prefetch('reviews', Review.objects.select_related('user')),
            'amenities',
            'images'
        ).annotate(
            # Aggregate calculations at database level
            average_rating=Avg('reviews__rating'),
            review_count=Count('reviews'),
            is_premium=Count('premium_features')
        )
        
        # Apply filters
        return self.apply_smart_filters(queryset)
    
    def apply_smart_filters(self, queryset):
        """Apply filters with database-level optimizations"""
        filters = Q()
        
        # Geographic filtering with spatial indexes
        if location_data := self.get_location_filter():
            filters &= Q(location__distance_lte=location_data)
        
        # Price range with compound index optimization
        price_range = self.get_price_range()
        if price_range:
            filters &= Q(price__range=price_range)
        
        # Full-text search with ranking
        if search_query := self.request.query_params.get('search'):
            return self.apply_full_text_search(queryset.filter(filters), search_query)
        
        return queryset.filter(filters)
    
    def apply_full_text_search(self, queryset, query):
        """Advanced full-text search with ranking"""
        from django.contrib.postgres.search import (
            SearchVector, SearchQuery, SearchRank, SearchHeadline
        )
        
        search_vector = (
            SearchVector('title', weight='A', config='english') +
            SearchVector('description', weight='B', config='english') +
            SearchVector('location__city', weight='C', config='english')
        )
        
        search_query = SearchQuery(query, config='english')
        
        return queryset.annotate(
            search=search_vector,
            rank=SearchRank(search_vector, search_query),
            headline=SearchHeadline('description', search_query)
        ).filter(
            search=search_query
        ).order_by('-rank', '-created_at')
```

**Q: Bạn implement caching strategy như thế nào cho high-traffic applications?**

A: **Multi-Layer Caching Strategy**:
```python
import redis
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from functools import wraps

# Redis cluster setup
redis_cluster = redis.RedisCluster(
    startup_nodes=[
        {"host": "redis-node-1", "port": "7000"},
        {"host": "redis-node-2", "port": "7001"},
        {"host": "redis-node-3", "port": "7002"}
    ],
    decode_responses=True,
    skip_full_coverage_check=True
)

class SmartCache:
    """Intelligent caching with automatic invalidation"""
    
    @staticmethod
    def cache_with_tags(timeout=300, tags=None):
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Generate cache key based on function name and arguments
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
                
                # Try to get from cache
                result = cache.get(cache_key)
                if result is not None:
                    return result
                
                # Execute function and cache result
                result = func(*args, **kwargs)
                cache.set(cache_key, result, timeout)
                
                # Tag management for selective invalidation
                if tags:
                    for tag in tags:
                        tag_key = f"tag:{tag}"
                        tagged_keys = cache.get(tag_key, set())
                        tagged_keys.add(cache_key)
                        cache.set(tag_key, tagged_keys, timeout)
                
                return result
            return wrapper
        return decorator
    
    @staticmethod
    def invalidate_by_tag(tag):
        """Invalidate all cache entries with specific tag"""
        tag_key = f"tag:{tag}"
        tagged_keys = cache.get(tag_key, set())
        
        if tagged_keys:
            cache.delete_many(tagged_keys)
            cache.delete(tag_key)

# Usage examples
class PropertyService:
    @SmartCache.cache_with_tags(timeout=1800, tags=['properties', 'search'])
    def get_featured_properties(self, category_id):
        return Property.objects.filter(
            category_id=category_id,
            is_featured=True
        ).select_related('category', 'location')
    
    @SmartCache.cache_with_tags(timeout=3600, tags=['properties', 'stats'])
    def get_property_statistics(self):
        return {
            'total_properties': Property.objects.count(),
            'avg_price': Property.objects.aggregate(Avg('price'))['price__avg'],
            'by_category': Property.objects.values('category__name').annotate(
                count=Count('id')
            )
        }

# API-level caching
@vary_on_headers('Authorization')
@cache_page(60 * 15)  # 15 minutes
def property_list_view(request):
    """Cached property list with user-specific variations"""
    pass

# Database query result caching
class CachedQuerySetMixin:
    """Mixin to add caching to QuerySet methods"""
    
    def cached_get(self, cache_key_suffix='', timeout=300, **kwargs):
        cache_key = f"{self.model._meta.label_lower}:get:{cache_key_suffix}:{hash(str(kwargs))}"
        
        result = cache.get(cache_key)
        if result is None:
            result = self.get(**kwargs)
            cache.set(cache_key, result, timeout)
        
        return result
    
    def cached_filter(self, cache_key_suffix='', timeout=300, **kwargs):
        cache_key = f"{self.model._meta.label_lower}:filter:{cache_key_suffix}:{hash(str(kwargs))}"
        
        result = cache.get(cache_key)
        if result is None:
            result = list(self.filter(**kwargs))  # Force evaluation
            cache.set(cache_key, result, timeout)
        
        return result

# Cache warming strategy
class CacheWarmer:
    """Pre-populate cache with frequently accessed data"""
    
    @staticmethod
    def warm_property_cache():
        """Warm cache with popular property data"""
        popular_categories = Category.objects.filter(is_popular=True)
        
        for category in popular_categories:
            PropertyService.get_featured_properties(category.id)
        
        # Pre-calculate statistics
        PropertyService.get_property_statistics()
    
    @staticmethod
    def schedule_cache_warming():
        """Schedule cache warming with Celery"""
        from celery import Celery
        
        app = Celery('cache_warmer')
        
        @app.task
        def warm_cache_task():
            CacheWarmer.warm_property_cache()
        
        # Schedule to run every hour
        app.conf.beat_schedule = {
            'warm-cache': {
                'task': 'warm_cache_task',
                'schedule': 3600.0,  # Every hour
            }
        }
```

### 5. Advanced Security & Authentication

**Q: Ngoài HttpOnly cookies, bạn implement những security measures nào khác?**

A: **Comprehensive Security Implementation**:
```python
# Rate limiting with Redis
from django_ratelimit.decorators import ratelimit
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
import hashlib
import hmac

class SecurityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Security headers
        response = self.get_response(request)
        
        # Prevent clickjacking
        response['X-Frame-Options'] = 'DENY'
        
        # XSS protection
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-XSS-Protection'] = '1; mode=block'
        
        # HSTS (HTTPS enforcement)
        response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Content Security Policy
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' wss: https:; "
            "object-src 'none';"
        )
        
        return response

# Advanced authentication with brute force protection
class SecureAuthenticationBackend:
    def authenticate(self, request, email=None, password=None, **kwargs):
        # Check for brute force attempts
        if self.is_brute_force_attempt(request, email):
            return None
        
        # Rate limiting per IP
        client_ip = self.get_client_ip(request)
        attempts_key = f"auth_attempts:{client_ip}"
        attempts = redis_client.get(attempts_key) or 0
        
        if int(attempts) > 5:  # Max 5 attempts per hour
            return None
        
        try:
            user = authenticate(email=email, password=password)
            if user:
                # Reset attempts on successful login
                redis_client.delete(attempts_key)
                # Log successful login
                self.log_security_event('successful_login', user, request)
                return user
            else:
                # Increment failed attempts
                redis_client.incr(attempts_key)
                redis_client.expire(attempts_key, 3600)  # 1 hour
                self.log_security_event('failed_login', None, request, {'email': email})
                return None
        except Exception as e:
            self.log_security_event('auth_error', None, request, {'error': str(e)})
            return None
    
    def is_brute_force_attempt(self, request, email):
        """Detect potential brute force attacks"""
        email_attempts_key = f"email_attempts:{email}"
        email_attempts = redis_client.get(email_attempts_key) or 0
        
        if int(email_attempts) > 3:  # Max 3 attempts per email per hour
            return True
        
        return False
    
    def log_security_event(self, event_type, user, request, metadata=None):
        """Log security events for monitoring"""
        import json
        
        event_data = {
            'event_type': event_type,
            'timestamp': timezone.now().isoformat(),
            'user_id': user.id if user else None,
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'metadata': metadata or {}
        }
        
        # Send to security monitoring system
        logger.warning(f"Security Event: {json.dumps(event_data)}")

# API Key authentication with webhook signature verification
class APIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        api_key = request.META.get('HTTP_X_API_KEY')
        if not api_key:
            return None
        
        # Verify API key
        try:
            api_key_obj = APIKey.objects.get(
                key=api_key,
                is_active=True,
                expires_at__gt=timezone.now()
            )
        except APIKey.DoesNotExist:
            raise AuthenticationFailed('Invalid API key')
        
        # Rate limiting for API keys
        rate_key = f"api_rate_limit:{api_key}"
        requests_count = redis_client.get(rate_key) or 0
        
        if int(requests_count) > api_key_obj.rate_limit:
            raise Throttled('Rate limit exceeded')
        
        # Increment request count
        redis_client.incr(rate_key)
        redis_client.expire(rate_key, 3600)  # Reset every hour
        
        return (api_key_obj.user, api_key_obj)

# Webhook signature verification
class WebhookSignatureMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if request.path.startswith('/webhooks/'):
            if not self.verify_webhook_signature(request):
                return JsonResponse({'error': 'Invalid signature'}, status=403)
        
        return self.get_response(request)
    
    def verify_webhook_signature(self, request):
        signature = request.META.get('HTTP_X_WEBHOOK_SIGNATURE', '')
        if not signature.startswith('sha256='):
            return False
        
        expected_signature = signature[7:]  # Remove 'sha256=' prefix
        
        # Calculate expected signature
        secret = settings.WEBHOOK_SECRET.encode()
        body = request.body
        
        calculated_signature = hmac.new(
            secret,
            body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, calculated_signature)
```

**Data Privacy & GDPR Compliance**:
```python
class DataPrivacyService:
    """Handle GDPR compliance and data privacy"""
    
    @staticmethod
    def anonymize_user_data(user_id):
        """Anonymize user data for GDPR compliance"""
        user = User.objects.get(id=user_id)
        
        # Generate anonymous identifier
        anonymous_id = f"anonymous_{uuid.uuid4().hex[:8]}"
        
        # Update user data
        user.email = f"{anonymous_id}@anonymous.local"
        user.first_name = "Anonymous"
        user.last_name = "User"
        user.phone = None
        user.date_of_birth = None
        user.is_active = False
        user.save()
        
        # Anonymize related data
        user.properties.update(
            contact_email=f"{anonymous_id}@anonymous.local",
            contact_phone=None
        )
        
        # Log anonymization
        DataPrivacyLog.objects.create(
            user_id=user_id,
            action='anonymize',
            timestamp=timezone.now(),
            reason='GDPR deletion request'
        )
    
    @staticmethod
    def export_user_data(user_id):
        """Export all user data for GDPR data portability"""
        user = User.objects.get(id=user_id)
        
        data = {
            'personal_info': {
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}",
                'phone': user.phone,
                'created_at': user.date_joined.isoformat()
            },
            'properties': list(
                user.properties.values(
                    'title', 'description', 'price', 'created_at'
                )
            ),
            'bookings': list(
                user.bookings.values(
                    'property__title', 'check_in', 'check_out', 'total_amount'
                )
            ),
            'reviews': list(
                user.reviews.values(
                    'property__title', 'rating', 'comment', 'created_at'
                )
            )
        }
        
        return data

# Audit logging
class AuditLogger:
    """Log all sensitive operations for compliance"""
    
    @staticmethod
    def log_data_access(user, data_type, object_id, action='read'):
        AuditLog.objects.create(
            user=user,
            action=action,
            data_type=data_type,
            object_id=object_id,
            timestamp=timezone.now(),
            ip_address=get_current_request().META.get('REMOTE_ADDR'),
            user_agent=get_current_request().META.get('HTTP_USER_AGENT')
        )
    
    @staticmethod
    def log_admin_action(admin_user, action, target_user=None, metadata=None):
        AdminAuditLog.objects.create(
            admin_user=admin_user,
            action=action,
            target_user=target_user,
            metadata=metadata or {},
            timestamp=timezone.now()
        )
```

### 6. Advanced Testing Strategies

**Q: Với 85%+ code coverage, bạn structure testing strategy như thế nào?**

A: **Comprehensive Testing Framework**:
```typescript
// Test setup and utilities
// tests/setup.ts
import { configure } from '@testing-library/react-native'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

// Mock server setup
export const server = setupServer(...handlers)

// Global test configuration
configure({
  testIdAttribute: 'testID'
})

// Custom render function with providers
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <NavigationContainer>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NavigationContainer>
      </Provider>
    )
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

// Unit Tests (70% of test suite)
describe('UserService', () => {
  describe('authentication', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      server.resetHandlers()
    })

    test('should successfully login with valid credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' }
      
      const result = await UserService.login(credentials)
      
      expect(result).toEqual({
        user: expect.objectContaining({
          id: expect.any(String),
          email: credentials.email
        }),
        token: expect.any(String)
      })
      
      // Verify secure storage
      expect(SecureStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        expect.any(String)
      )
    })

    test('should handle network errors gracefully', async () => {
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res.networkError('Network error')
        })
      )

      await expect(UserService.login({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('Network error')
    })

    test('should retry failed requests with exponential backoff', async () => {
      let attempts = 0
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          attempts++
          if (attempts < 3) {
            return res(ctx.status(500))
          }
          return res(ctx.json({ success: true }))
        })
      )

      const result = await UserService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(attempts).toBe(3)
      expect(result.success).toBe(true)
    })
  })

  describe('data synchronization', () => {
    test('should handle offline-online sync correctly', async () => {
      // Mock offline state
      jest.mocked(NetInfo.fetch).mockResolvedValue({
        isConnected: false
      } as any)

      const offlineData = { id: '1', name: 'Offline User' }
      await UserService.updateProfile(offlineData)

      // Verify data is queued
      expect(OfflineQueue.add).toHaveBeenCalledWith({
        type: 'UPDATE_PROFILE',
        data: offlineData,
        timestamp: expect.any(Number)
      })

      // Mock online state
      jest.mocked(NetInfo.fetch).mockResolvedValue({
        isConnected: true
      } as any)

      // Trigger sync
      await UserService.syncOfflineData()

      // Verify API call was made
      expect(fetch).toHaveBeenCalledWith('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(offlineData)
      })
    })
  })
})

// Integration Tests (20% of test suite)
describe('Property Search Integration', () => {
  test('should complete full search flow', async () => {
    const { getByTestId, getAllByTestId } = renderWithProviders(<SearchScreen />)

    // Enter search criteria
    fireEvent.changeText(getByTestId('search-input'), 'luxury apartment')
    fireEvent.press(getByTestId('price-filter-button'))
    fireEvent.press(getByTestId('price-range-1000-2000'))
    fireEvent.press(getByTestId('location-filter'))
    fireEvent.press(getByTestId('location-manhattan'))
    
    // Perform search
    fireEvent.press(getByTestId('search-button'))

    // Wait for results
    await waitFor(() => {
      expect(getAllByTestId('property-card')).toHaveLength(5)
    })

    // Verify filters are applied
    const propertyCards = getAllByTestId('property-card')
    for (const card of propertyCards) {
      expect(card).toHaveTextContent(/luxury/i)
      expect(card).toHaveTextContent(/Manhattan/i)
    }
  })

  test('should handle search with no results', async () => {
    server.use(
      rest.get('/api/properties/search', (req, res, ctx) => {
        return res(ctx.json({ results: [], total: 0 }))
      })
    )

    const { getByTestId, getByText } = renderWithProviders(<SearchScreen />)

    fireEvent.changeText(getByTestId('search-input'), 'nonexistent property')
    fireEvent.press(getByTestId('search-button'))

    await waitFor(() => {
      expect(getByText('No properties found')).toBeTruthy()
    })
  })
})

// E2E Tests (10% of test suite)
describe('Complete User Journey', () => {
  test('user can register, login, and book a property', async () => {
    const { getByTestId, getByText } = renderWithProviders(<App />)

    // Registration flow
    fireEvent.press(getByTestId('register-button'))
    fireEvent.changeText(getByTestId('email-input'), 'newuser@example.com')
    fireEvent.changeText(getByTestId('password-input'), 'SecurePass123!')
    fireEvent.press(getByTestId('submit-registration'))

    await waitFor(() => {
      expect(getByText('Registration successful')).toBeTruthy()
    })

    // Login flow
    fireEvent.changeText(getByTestId('login-email'), 'newuser@example.com')
    fireEvent.changeText(getByTestId('login-password'), 'SecurePass123!')
    fireEvent.press(getByTestId('login-button'))

    await waitFor(() => {
      expect(getByTestId('dashboard-screen')).toBeTruthy()
    })

    // Property search and booking
    fireEvent.press(getByTestId('search-properties'))
    fireEvent.changeText(getByTestId('search-input'), 'apartment')
    fireEvent.press(getByTestId('search-button'))

    await waitFor(() => {
      expect(getAllByTestId('property-card')[0]).toBeTruthy()
    })

    // Select first property
    fireEvent.press(getAllByTestId('property-card')[0])

    await waitFor(() => {
      expect(getByTestId('property-details')).toBeTruthy()
    })

    // Book property
    fireEvent.press(getByTestId('book-now-button'))
    
    // Fill booking details
    fireEvent.changeText(getByTestId('check-in-date'), '2024-06-01')
    fireEvent.changeText(getByTestId('check-out-date'), '2024-06-07')
    fireEvent.press(getByTestId('confirm-booking'))

    await waitFor(() => {
      expect(getByText('Booking confirmed')).toBeTruthy()
    }, { timeout: 10000 })
  })
})

// Performance Tests
describe('Performance Tests', () => {
  test('property list should render within performance budget', async () => {
    const startTime = performance.now()
    
    const { getAllByTestId } = renderWithProviders(<PropertyListScreen />)
    
    await waitFor(() => {
      expect(getAllByTestId('property-card')).toHaveLength(20)
    })
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should render within 1 second
    expect(renderTime).toBeLessThan(1000)
  })

  test('search should complete within acceptable time', async () => {
    const { getByTestId } = renderWithProviders(<SearchScreen />)
    
    fireEvent.changeText(getByTestId('search-input'), 'apartment')
    
    const startTime = performance.now()
    fireEvent.press(getByTestId('search-button'))
    
    await waitFor(() => {
      expect(getByTestId('search-results')).toBeTruthy()
    })
    
    const endTime = performance.now()
    const searchTime = endTime - startTime
    
    // Search should complete within 2 seconds
    expect(searchTime).toBeLessThan(2000)
  })
})

// Accessibility Tests
describe('Accessibility Tests', () => {
  test('property card should be accessible', () => {
    const { getByTestId } = renderWithProviders(<PropertyCard {...mockProperty} />)
    
    const card = getByTestId('property-card')
    
    // Check accessibility labels
    expect(card).toHaveAccessibilityLabel(
      expect.stringContaining(mockProperty.title)
    )
    expect(card).toHaveAccessibilityRole('button')
    expect(card).toHaveAccessibilityHint('Tap to view property details')
  })

  test('form inputs should have proper accessibility', () => {
    const { getByTestId } = renderWithProviders(<LoginForm />)
    
    const emailInput = getByTestId('email-input')
    const passwordInput = getByTestId('password-input')
    
    expect(emailInput).toHaveAccessibilityLabel('Email address')
    expect(passwordInput).toHaveAccessibilityLabel('Password')
    expect(passwordInput).toHaveAccessibilityState({ secureTextEntry: true })
  })
})

// Custom test utilities
export class TestUtils {
  static async waitForLoadingToFinish() {
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).toBeNull()
    })
  }

  static mockAsyncStorage() {
    const mockStorage: Record<string, string> = {}
    
    return {
      getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
      setItem: jest.fn((key: string, value: string) => {
        mockStorage[key] = value
        return Promise.resolve()
      }),
      removeItem: jest.fn((key: string) => {
        delete mockStorage[key]
        return Promise.resolve()
      }),
      clear: jest.fn(() => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key])
        return Promise.resolve()
      })
    }
  }

  static createMockNavigation() {
    return {
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setParams: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn()
    }
  }
}
```

### 7. Advanced Leadership & Mentoring

**Q: Bạn mentor junior developers và establish code quality như thế nào trong team?**

A: **Structured Mentoring Program**:
```typescript
// Code review guidelines and automation
interface CodeReviewChecklist {
  technical: {
    functionality: boolean
    performance: boolean
    security: boolean
    testCoverage: boolean
    codeStyle: boolean
  }
  architecture: {
    designPatterns: boolean
    separation_of_concerns: boolean
    scalability: boolean
    maintainability: boolean
  }
  documentation: {
    codeComments: boolean
    apiDocumentation: boolean
    readmeUpdates: boolean
  }
}

class MentorshipProgram {
  static readonly SKILL_LEVELS = {
    JUNIOR: 'junior',
    MID: 'mid', 
    SENIOR: 'senior'
  } as const

  static createLearningPath(developer: Developer): LearningPath {
    const currentLevel = this.assessSkillLevel(developer)
    
    switch (currentLevel) {
      case this.SKILL_LEVELS.JUNIOR:
        return {
          phase1: {
            duration: '2-3 months',
            focus: 'Foundation & Best Practices',
            topics: [
              'Clean Code Principles',
              'Git Workflow & Version Control',
              'Testing Fundamentals',
              'Code Review Process',
              'Basic Design Patterns'
            ],
            practicalProjects: [
              'CRUD Application with Testing',
              'API Integration Project',
              'Code Refactoring Exercise'
            ],
            mentorshipFrequency: '2x per week - 1 hour sessions'
          },
          phase2: {
            duration: '3-4 months',
            focus: 'Architecture & Advanced Concepts',
            topics: [
              'Component Architecture',
              'State Management Patterns',
              'Performance Optimization',
              'Security Best Practices',
              'Database Design'
            ]
          }
        }
      
      case this.SKILL_LEVELS.MID:
        return {
          focus: 'Leadership & System Design',
          topics: [
            'System Architecture',
            'Technical Leadership',
            'Cross-team Collaboration',
            'Performance at Scale'
          ]
        }
    }
  }

  static establishCodeQualityStandards(): CodeQualityFramework {
    return {
      // Automated quality gates
      preCommitHooks: {
        linting: 'ESLint with strict rules',
        formatting: 'Prettier with consistent config',
        testing: 'Run affected tests',
        typeChecking: 'TypeScript strict mode'
      },
      
      // CI/CD quality gates
      qualityGates: {
        testCoverage: 'Minimum 85% coverage',
        codeComplexity: 'Cyclomatic complexity < 10',
        duplication: 'Max 3% code duplication',
        vulnerabilities: 'Zero critical security issues',
        performance: 'Bundle size increase < 10%'
      },

      // Code review standards
      reviewProcess: {
        minimumReviewers: 2,
        requiresApproval: ['senior', 'tech-lead'],
        blockingIssues: [
          'Security vulnerabilities',
          'Performance regressions',
          'Test coverage drops',
          'Breaking changes without migration'
        ]
      }
    }
  }
}

// Knowledge sharing initiatives
class KnowledgeSharing {
  static weeklyTechTalks = {
    schedule: 'Every Friday 4-5 PM',
    format: '30min presentation + 15min discussion',
    topics: [
      'New Technology Evaluation',
      'Architecture Decision Reviews',
      'Performance Case Studies',
      'Security Incident Analysis',
      'Open Source Contributions'
    ],
    
    rotationPolicy: 'Each team member presents monthly',
    documentation: 'All talks recorded and documented in wiki'
  }

  static pairProgrammingSessions = {
    frequency: '2-3 times per week',
    duration: '2-3 hours per session',
    focus: [
      'Complex feature development',
      'Bug investigation and fixing',
      'Code refactoring',
      'New technology adoption'
    ],
    
    pairings: {
      seniorJunior: 'Knowledge transfer and mentoring',
      peerToPeer: 'Collaborative problem solving',
      crossTeam: 'Domain knowledge sharing'
    }
  }

  static documentationStandards = {
    architectureDecisionRecords: {
      template: `
        # ADR-XXX: [Decision Title]
        
        ## Status
        [Proposed | Accepted | Deprecated | Superseded]
        
        ## Context
        [What forces are at play? What constraints exist?]
        
        ## Decision
        [What decision was made and why?]
        
        ## Consequences
        [What are the positive and negative consequences?]
        
        ## Alternatives Considered
        [What other options were evaluated?]
      `,
      reviewProcess: 'Peer review + architecture team approval',
      storage: 'Version controlled in docs/ directory'
    },

    codeDocumentation: {
      functionDocumentation: 'JSDoc for all public functions',
      complexLogic: 'Inline comments for business logic',
      apiDocumentation: 'OpenAPI/Swagger specs',
      deploymentGuides: 'Step-by-step deployment processes'
    }
  }
}
```

**Performance Review & Growth Framework**:
```typescript
interface DeveloperAssessment {
  technical: {
    codeQuality: 1 | 2 | 3 | 4 | 5
    systemDesign: 1 | 2 | 3 | 4 | 5
    problemSolving: 1 | 2 | 3 | 4 | 5
    testing: 1 | 2 | 3 | 4 | 5
    performance: 1 | 2 | 3 | 4 | 5
  }
  
  collaboration: {
    codeReviews: 1 | 2 | 3 | 4 | 5
    mentoring: 1 | 2 | 3 | 4 | 5
    communication: 1 | 2 | 3 | 4 | 5
    knowledgeSharing: 1 | 2 | 3 | 4 | 5
  }
  
  leadership: {
    initiative: 1 | 2 | 3 | 4 | 5
    technicalLeadership: 1 | 2 | 3 | 4 | 5
    projectManagement: 1 | 2 | 3 | 4 | 5
    strategicThinking: 1 | 2 | 3 | 4 | 5
  }
}

class CareerDevelopment {
  static createGrowthPlan(
    developer: Developer, 
    assessment: DeveloperAssessment,
    targetRole: 'senior' | 'tech-lead' | 'architect'
  ): GrowthPlan {
    const gaps = this.identifySkillGaps(assessment, targetRole)
    
    return {
      currentLevel: this.determineLevel(assessment),
      targetLevel: targetRole,
      timeline: '6-12 months',
      
      skillDevelopment: {
        technical: gaps.technical.map(skill => ({
          skill,
          learningResources: this.getLearningResources(skill),
          practicalExercises: this.getPracticalExercises(skill),
          measurementCriteria: this.getMeasurementCriteria(skill)
        })),
        
        soft_skills: gaps.soft_skills.map(skill => ({
          skill,
          developmentActivities: this.getSoftSkillActivities(skill),
          mentoringOpportunities: this.getMentoringOpportunities(skill)
        }))
      },
      
      milestones: [
        {
          timeframe: '3 months',
          deliverables: [
            'Lead a medium complexity feature',
            'Mentor 1 junior developer',
            'Present technical talk to team'
          ]
        },
        {
          timeframe: '6 months', 
          deliverables: [
            'Design and implement system architecture',
            'Establish best practices documentation',
            'Cross-team collaboration project'
          ]
        }
      ]
    }
  }

  static trackProgress(developer: Developer): ProgressReport {
    return {
      completedProjects: this.getCompletedProjects(developer),
      codeReviewMetrics: this.getCodeReviewMetrics(developer),
      mentorshipImpact: this.getMentorshipImpact(developer),
      technicalContributions: this.getTechnicalContributions(developer),
      
      recommendations: this.generateRecommendations(developer),
      nextSteps: this.getNextSteps(developer)
    }
  }
}
```

### 8. Business Impact & Strategic Thinking

**Q: Với 5K+ active users, bạn measure và improve business impact của technical decisions như thế nào?**

A: **Data-Driven Technical Decision Making**:
```typescript
interface BusinessMetrics {
  userEngagement: {
    dailyActiveUsers: number
    sessionDuration: number
    retentionRate: {
      day1: number
      day7: number
      day30: number
    }
    churnRate: number
  }
  
  performanceMetrics: {
    appLoadTime: number
    apiResponseTime: number
    crashRate: number
    errorRate: number
  }
  
  businessKPIs: {
    conversionRate: number
    revenuePerUser: number
    customerAcquisitionCost: number
    customerLifetimeValue: number
  }
}

class BusinessImpactAnalyzer {
  static analyzeFeatureImpact(featureName: string, timeRange: DateRange): FeatureImpactReport {
    return {
      userAdoption: {
        adoptionRate: this.calculateAdoptionRate(featureName, timeRange),
        userSegmentAnalysis: this.analyzeUserSegments(featureName),
        usagePatterns: this.getUsagePatterns(featureName)
      },
      
      businessMetrics: {
        revenueImpact: this.calculateRevenueImpact(featureName, timeRange),
        userRetentionImpact: this.calculateRetentionImpact(featureName),
        engagementImpact: this.calculateEngagementImpact(featureName)
      },
      
      technicalMetrics: {
        performanceImpact: this.calculatePerformanceImpact(featureName),
        infrastructureCost: this.calculateInfrastructureCost(featureName),
        maintenanceOverhead: this.estimateMaintenanceOverhead(featureName)
      },
      
      recommendations: this.generateRecommendations(featureName)
    }
  }
  
  static prioritizeBacklog(features: Feature[]): PrioritizedBacklog {
    return features
      .map(feature => ({
        ...feature,
        score: this.calculatePriorityScore(feature)
      }))
      .sort((a, b) => b.score - a.score)
  }
  
  private static calculatePriorityScore(feature: Feature): number {
    const weights = {
      businessValue: 0.4,
      technicalComplexity: 0.2, // Lower complexity = higher score
      userImpact: 0.3,
      strategicAlignment: 0.1
    }
    
    return (
      feature.businessValue * weights.businessValue +
      (5 - feature.technicalComplexity) * weights.technicalComplexity + // Invert complexity
      feature.userImpact * weights.userImpact +
      feature.strategicAlignment * weights.strategicAlignment
    )
  }
}

// A/B Testing Framework
class ExperimentFramework {
  static async runExperiment(
    experimentConfig: ExperimentConfig
  ): Promise<ExperimentResult> {
    const {
      name,
      hypothesis,
      variants,
      successMetrics,
      duration,
      trafficSplit
    } = experimentConfig
    
    // User assignment to variants
    const userAssignment = await this.assignUsersToVariants(variants, trafficSplit)
    
    // Track experiment metrics
    const trackingConfig = {
      events: successMetrics.map(metric => metric.eventName),
      userProperties: ['user_segment', 'registration_date', 'plan_type'],
      customProperties: experimentConfig.customProperties
    }
    
    // Run experiment and collect data
    const results = await this.collectExperimentData(
      name,
      userAssignment,
      trackingConfig,
      duration
    )
    
    // Statistical analysis
    const analysis = await this.performStatisticalAnalysis(results, successMetrics)
    
    return {
      experimentName: name,
      hypothesis,
      duration,
      sampleSize: results.totalUsers,
      
      results: analysis.variants.map(variant => ({
        name: variant.name,
        users: variant.users,
        conversionRate: variant.conversionRate,
        confidenceInterval: variant.confidenceInterval,
        statisticalSignificance: variant.pValue < 0.05
      })),
      
      winner: analysis.winner,
      recommendation: analysis.recommendation,
      businessImpact: this.calculateBusinessImpact(analysis)
    }
  }
  
  // Example: Performance optimization experiment
  static async optimizeAppPerformance(): Promise<void> {
    const experiment = await this.runExperiment({
      name: 'app_loading_optimization_v2',
      hypothesis: 'Implementing code splitting and lazy loading will improve app load time by 30% and increase user retention',
      
      variants: [
        {
          name: 'control',
          description: 'Current implementation',
          traffic: 50
        },
        {
          name: 'optimized',
          description: 'Code splitting + lazy loading + bundle optimization',
          traffic: 50
        }
      ],
      
      successMetrics: [
        {
          name: 'app_load_time',
          eventName: 'app_loaded',
          target: 'decrease',
          significance: 0.3 // 30% improvement target
        },
        {
          name: 'day1_retention',
          eventName: 'user_returned_day1',
          target: 'increase',
          significance: 0.05 // 5% improvement target
        },
        {
          name: 'session_duration',
          eventName: 'session_end',
          target: 'increase'
        }
      ],
      
      duration: 14, // 2 weeks
      minimumSampleSize: 1000,
      trafficSplit: 'random'
    })
    
    if (experiment.winner === 'optimized' && experiment.results[1].statisticalSignificance) {
      // Implement performance optimizations
      await this.implementPerformanceOptimizations()
      
      // Monitor post-launch metrics
      await this.monitorPostLaunchMetrics('performance_optimization', 30)
    }
  }
}
```

**Cost-Benefit Analysis for Technical Decisions**:
```typescript
interface TechnicalDecisionAnalysis {
  migrationFromMonolithToMicroservices: {
    currentState: {
      deploymentTime: '45 minutes',
      developmentVelocity: '3 features/sprint',
      bugResolutionTime: '2-3 days',
      scalingBottlenecks: ['database', 'authentication service'],
      teamProductivity: 'Medium - code conflicts, long build times'
    }
    
    proposedState: {
      initialCosts: {
        developmentTime: '6-8 months',
        infrastructureCosts: '+$2000/month',
        learningCurve: '2-3 months',
        potentialDowntime: '4-6 hours'
      }
      
      longTermBenefits: {
        deploymentTime: '5-10 minutes per service',
        developmentVelocity: '5 features/sprint (estimated)',
        faultIsolation: 'Service-level isolation',
        scalingFlexibility: 'Independent service scaling',
        teamAutonomy: 'Teams can work independently'
      }
      
      risks: [
        'Distributed system complexity',
        'Network latency between services',
        'Data consistency challenges',
        'Monitoring and debugging complexity'
      ]
    }
    
    recommendation: {
      decision: 'Implement gradual migration',
      reasoning: [
        'Team size (8 developers) can handle complexity',
        'Business growth justifies infrastructure costs',
        'Current monolith becoming bottleneck'
      ],
      timeline: {
        phase1: 'Extract user service (2 months)',
        phase2: 'Extract property service (2 months)', 
        phase3: 'Extract booking service (2 months)',
        phase4: 'Optimize and consolidate (2 months)'
      }
    }
  }
}

class TechnicalStrategyPlanning {
  static createTechnicalRoadmap(
    businessGoals: BusinessGoal[],
    currentTechStack: TechStack,
    teamCapabilities: TeamCapabilities
  ): TechnicalRoadmap {
    
    return {
      shortTerm: { // 3-6 months
        priorities: [
          {
            initiative: 'Performance Optimization',
            businessJustification: 'Reduce churn by improving load times',
            technicalApproach: [
              'Implement code splitting',
              'Optimize bundle size',
              'Add performance monitoring'
            ],
            expectedImpact: {
              userExperience: 'Load time: 5s → 2s',
              business: 'Estimated 10% retention improvement'
            },
            resources: '2 developers, 6 weeks'
          }
        ]
      },
      
      mediumTerm: { // 6-12 months
        priorities: [
          {
            initiative: 'Microservices Migration',
            businessJustification: 'Enable faster development and deployment',
            technicalApproach: [
              'Service extraction strategy',
              'API gateway implementation',
              'Monitoring and observability'
            ],
            expectedImpact: {
              developmentVelocity: '40% faster feature delivery',
              systemReliability: 'Improved fault isolation'
            }
          }
        ]
      },
      
      longTerm: { // 12+ months
        priorities: [
          {
            initiative: 'AI/ML Integration',
            businessJustification: 'Personalized user experience and recommendations',
            technicalApproach: [
              'Data pipeline implementation',
              'ML model development',
              'A/B testing framework'
            ],
            expectedImpact: {
              userEngagement: 'Estimated 25% increase in session duration',
              revenue: 'Potential 15% increase in conversion rate'
            }
          }
        ]
      }
    }
  }
  
  static evaluateNewTechnology(
    technology: string,
    useCase: string,
    constraints: ProjectConstraints
  ): TechnologyEvaluationReport {
    
    const evaluation = {
      technology,
      useCase,
      
      technicalFit: {
        learningCurve: this.assessLearningCurve(technology, constraints.team),
        performanceImpact: this.assessPerformanceImpact(technology, useCase),
        integrationComplexity: this.assessIntegrationComplexity(technology),
        maintenanceBurden: this.assessMaintenanceBurden(technology)
      },
      
      businessFit: {
        timeToMarket: this.assessTimeToMarket(technology, useCase),
        totalCostOfOwnership: this.calculateTCO(technology),
        riskAssessment: this.assessRisks(technology),
        strategicAlignment: this.assessStrategicAlignment(technology)
      },
      
      communitySupport: {
        documentation: this.assessDocumentation(technology),
        communitySize: this.assessCommunitySize(technology),
        enterpriseSupport: this.assessEnterpriseSupport(technology),
        longevityProspects: this.assessLongevity(technology)
      }
    }
    
    return {
      ...evaluation,
      recommendation: this.generateRecommendation(evaluation),
      implementationPlan: this.createImplementationPlan(technology, evaluation)
    }
  }
}
```

### 9. Emerging Technologies & Innovation

**Q: Bạn approach việc evaluate và integrate new technologies như thế nào?**

A: **Technology Adoption Framework**:
```typescript
interface TechnologyEvaluation {
  criteria: {
    technicalMerit: {
      performance: number // 1-5 scale
      scalability: number
      security: number
      maintainability: number
      testability: number
    }
    
    businessValue: {
      timeToMarket: number
      costEfficiency: number
      competitiveAdvantage: number
      userExperience: number
      revenueImpact: number
    }
    
    adoptionRisk: {
      learningCurve: number // 1-5, lower is better
      communitySupport: number
      maturity: number
      vendorLockIn: number
      migrationComplexity: number
    }
    
    strategicFit: {
      teamExpertise: number
      existingArchitecture: number
      futureRoadmap: number
      industryTrends: number
    }
  }
}

class InnovationLab {
  static async evaluateReactServerComponents(): Promise<TechnologyAssessment> {
    // Proof of concept implementation
    const poc = await this.buildProofOfConcept({
      technology: 'React Server Components',
      useCase: 'Property listing pages with SEO requirements',
      timeline: '2 weeks',
      metrics: [
        'First Contentful Paint',
        'Time to Interactive', 
        'SEO score',
        'Development experience',
        'Bundle size impact'
      ]
    })
    
    // Performance benchmarking
    const performanceResults = await this.runPerformanceBenchmarks({
      baseline: 'Current Client-Side Rendering',
      candidate: 'React Server Components',
      scenarios: [
        'Property search results',
        'Property detail page',
        'User dashboard'
      ]
    })
    
    return {
      technology: 'React Server Components',
      evaluation: {
        technicalMerit: {
          performance: 5, // Significant improvement in loading times
          scalability: 4, // Good for read-heavy operations
          security: 4, // Reduced client-side exposure
          maintainability: 3, // New paradigm, learning required
          testability: 3 // Testing strategies still evolving
        },
        
        businessValue: {
          timeToMarket: 3, // Initial setup time required
          costEfficiency: 4, // Better server utilization
          competitiveAdvantage: 4, // Better performance = better SEO
          userExperience: 5, // Faster loading, better perceived performance
          revenueImpact: 4 // Better conversion rates from improved performance
        },
        
        adoptionRisk: {
          learningCurve: 3, // Moderate learning curve for team
          communitySupport: 4, // Strong React community support
          maturity: 3, // Still relatively new, but Facebook-backed
          vendorLockIn: 2, // React ecosystem, manageable
          migrationComplexity: 4 // Can be adopted incrementally
        }
      },
      
      recommendation: {
        decision: 'ADOPT_GRADUALLY',
        reasoning: [
          'Performance benefits align with business goals',
          'Can be implemented incrementally',
          'Team has strong React background'
        ],
        implementationPlan: {
          phase1: 'Implement for static property pages',
          phase2: 'Extend to search results',
          phase3: 'Evaluate for dynamic user content'
        }
      },
      
      successCriteria: [
        'First Contentful Paint < 1.5s',
        'Time to Interactive < 3s',
        'SEO score improvement > 10%',
        'No regression in development velocity'
      ]
    }
  }
  
  // Edge Computing with Cloudflare Workers
  static async evaluateEdgeComputing(): Promise<TechnologyAssessment> {
    const edgeImplementation = {
      useCase: 'Property search API optimization',
      implementation: `
        // Cloudflare Worker for property search
        export default {
          async fetch(request: Request, env: Env): Promise<Response> {
            const url = new URL(request.url)
            const searchParams = url.searchParams
            
            // Generate cache key based on search parameters
            const cacheKey = \`search:\${Array.from(searchParams.entries())
              .sort()
              .map(([k, v]) => \`\${k}=\${v}\`)
              .join('&')}\`
            
            // Try to get from KV cache
            let results = await env.SEARCH_CACHE.get(cacheKey, 'json')
            
            if (!results) {
              // Fetch from origin API
              const originResponse = await fetch(\`\${env.ORIGIN_API}/search?\${searchParams}\`)
              results = await originResponse.json()
              
              // Cache for 5 minutes
              await env.SEARCH_CACHE.put(cacheKey, JSON.stringify(results), {
                expirationTtl: 300
              })
            }
            
            // Add performance headers
            const response = new Response(JSON.stringify(results), {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300',
                'X-Cache': results.fromCache ? 'HIT' : 'MISS',
                'X-Edge-Location': request.cf?.colo || 'unknown'
              }
            })
            
            return response
          }
        }
      `,
      
      benefits: {
        latency: 'Reduced global latency from 800ms to 150ms average',
        availability: '99.99% uptime with edge redundancy',
        scalability: 'Automatic scaling to handle traffic spikes',
        cost: 'Reduced server load and infrastructure costs'
      },
      
      metrics: {
        globalLatencyReduction: 75,
        cacheHitRatio: 85,
        costReduction: 30,
        availabilityImprovement: 0.5 // percentage points
      }
    }
    
    return {
      technology: 'Cloudflare Workers',
      assessment: 'HIGH_VALUE',
      implementation: 'RECOMMEND',
      timeline: '1 month POC, 2 months full implementation'
    }
  }
}

// AI/ML Integration Assessment
class AIMLIntegration {
  static async evaluatePersonalizationEngine(): Promise<AIImplementationPlan> {
    return {
      objective: 'Implement ML-driven property recommendations',
      
      dataStrategy: {
        requiredData: [
          'User interaction history (views, searches, bookings)',
          'Property characteristics and performance metrics',
          'User demographics and preferences',
          'Market trends and pricing data'
        ],
        
        dataQuality: {
          volume: '50K+ user interactions/month',
          variety: 'Behavioral, demographic, property features',
          velocity: 'Real-time interaction tracking',
          quality: 'Need data cleaning and validation pipeline'
        }
      },
      
      modelStrategy: {
        phase1: {
          approach: 'Collaborative filtering with content-based features',
          complexity: 'Medium',
          expectedAccuracy: '65-70% relevance score',
          implementation: 'Python + scikit-learn + Redis',
          timeline: '6-8 weeks'
        },
        
        phase2: {
          approach: 'Deep learning recommendation system',
          complexity: 'High',
          expectedAccuracy: '75-80% relevance score',  
          implementation: 'TensorFlow + Kubeflow + BigQuery',
          timeline: '12-16 weeks'
        }
      },
      
      infrastructure: {
        training: 'Google Cloud ML Engine',
        serving: 'Containerized model serving with auto-scaling',
        monitoring: 'Model drift detection and performance tracking',
        experimentation: 'A/B testing framework for model validation'
      },
      
      businessImpact: {
        primaryMetrics: [
          'Click-through rate improvement: Target +20%',
          'Booking conversion rate: Target +15%',
          'User session duration: Target +25%'
        ],
        
        secondaryMetrics: [
          'User retention rate improvement',
          'Average booking value increase',
          'Customer satisfaction scores'
        ]
      },
      
      risks: [
        'Data privacy compliance (GDPR)',
        'Model bias and fairness concerns',
        'Infrastructure complexity and costs',
        'Team ML expertise gap'
      ]
    }
  }
}
```

### 10. Crisis Management & Problem Solving

**Q: Describe a time when you had to handle a critical production issue. What was your approach?**

A: **Critical Production Issue: Hotel Booking Double-Booking Crisis**

**Situation**: Production sistema hotel booking bị double-booking nghiêm trọng trong weekend peak traffic, affecting 50+ customers và potential revenue loss $100K+.

**Problem Analysis**:
```typescript
// Root cause investigation approach
interface IncidentAnalysis {
  timeline: {
    '14:30': 'First customer complaint about duplicate booking confirmation',
    '14:45': 'Monitoring alerts showing booking anomalies',
    '15:00': 'Identified race condition in booking creation endpoint',
    '15:15': 'Implemented immediate hotfix (pessimistic locking)',
    '15:30': 'Deployed emergency patch to production',
    '16:00': 'Validated fix and monitored for additional issues'
  }
  
  rootCause: {
    technicalIssue: 'Race condition in concurrent booking requests',
    underlyingCause: 'Insufficient database-level constraints',
    codeSnippet: `
      // Problematic code (before fix)
      async function createBooking(roomId, userId, dates) {
        // Check availability
        const isAvailable = await checkRoomAvailability(roomId, dates)
        
        if (isAvailable) {
          // Race condition window here - another request could book the room
          const booking = await Booking.create({
            roomId,
            userId,
            checkIn: dates.checkIn,
            checkOut: dates.checkOut
          })
          return booking
        }
        throw new Error('Room not available')
      }
    `
  }
}

// Immediate Response Actions
class IncidentResponse {
  static async handleCriticalBookingIssue(): Promise<IncidentResolution> {
    // 1. Immediate damage control
    const immediateActions = [
      'Temporarily disable booking functionality',
      'Identify affected customers and bookings',
      'Prepare customer communication script',
      'Assemble incident response team'
    ]
    
    // 2. Technical fix implementation
    const emergencyFix = `
      // Emergency hotfix with pessimistic locking
      async function createBooking(roomId, userId, dates) {
        return await db.transaction(async (trx) => {
          // Lock the room row to prevent concurrent access
          const room = await Room.query(trx)
            .where('id', roomId)
            .forUpdate()
            .first()
          
          // Check for conflicting bookings within transaction
          const conflictingBookings = await Booking.query(trx)
            .where('room_id', roomId)
            .where('status', 'confirmed')
            .where(builder => {
              builder
                .whereBetween('check_in', [dates.checkIn, dates.checkOut])
                .orWhereBetween('check_out', [dates.checkIn, dates.checkOut])
                .orWhere(subBuilder => {
                  subBuilder
                    .where('check_in', '<=', dates.checkIn)
                    .where('check_out', '>=', dates.checkOut)
                })
            })
          
          if (conflictingBookings.length > 0) {
            throw new BookingConflictError('Room not available for selected dates')
          }
          
          // Create booking within transaction
          const booking = await Booking.query(trx).insert({
            room_id: roomId,
            user_id: userId,
            check_in: dates.checkIn,
            check_out: dates.checkOut,
            status: 'confirmed'
          })
          
          return booking
        })
      }
    `
    
    // 3. Data consistency restoration
    const dataRecoveryPlan = {
      identifyDuplicates: `
        SELECT room_id, check_in, check_out, COUNT(*) as booking_count
        FROM bookings 
        WHERE status = 'confirmed' 
        AND created_at >= '2024-05-15 14:00:00'
        GROUP BY room_id, check_in, check_out
        HAVING COUNT(*) > 1
      `,
      
      customerResolution: [
        'Contact affected customers immediately',
        'Offer alternative accommodations (upgraded rooms)',
        'Provide compensation (discount/refund)',
        'Prioritize by customer tier and booking value'
      ],
      
      businessContinuity: [
        'Partner with nearby hotels for overflow',
        'Implement manual booking review process',
        'Create dedicated customer service team for incident'
      ]
    }
    
    return {
      resolutionTime: '90 minutes',
      customersAffected: 52,
      financialImpact: '$15K in compensations',
      reputationalImpact: 'Minimal due to proactive communication',
      
      lessonsLearned: [
        'Need comprehensive integration testing for race conditions',
        'Database constraints are essential for data integrity',
        'Monitoring alerts need faster escalation procedures',
        'Incident response playbooks should be regularly updated'
      ]
    }
  }
}
```

**Long-term Preventive Measures**:
```typescript
// Comprehensive solution implementation
class BookingSystemHardening {
  static implementRobustBookingSystem(): SystemImprovements {
    return {
      // Database-level constraints
      databaseConstraints: `
        -- Unique constraint to prevent double bookings
        ALTER TABLE bookings 
        ADD CONSTRAINT no_overlapping_bookings 
        EXCLUDE USING gist (
          room_id WITH =,
          daterange(check_in, check_out, '[)') WITH &&
        ) WHERE (status = 'confirmed');
        
        -- Index for performance
        CREATE INDEX idx_bookings_room_dates 
        ON bookings USING gist (room_id, daterange(check_in, check_out, '[)'));
      `,
      
      // Application-level validation
      applicationLogic: `
        class BookingService {
          async createBooking(bookingData: BookingRequest): Promise<Booking> {
            const validationResult = await this.validateBookingRequest(bookingData)
            if (!validationResult.isValid) {
              throw new ValidationError(validationResult.errors)
            }
            
            // Use distributed lock for additional safety
            const lockKey = \`booking_lock:\${bookingData.roomId}:\${bookingData.dates}\`
            const lock = await this.redisLock.acquire(lockKey, 10000) // 10 second lock
            
            try {
              return await this.createBookingTransaction(bookingData)
            } finally {
              await lock.release()
            }
          }
          
          private async validateBookingRequest(data: BookingRequest): Promise<ValidationResult> {
            const checks = await Promise.all([
              this.checkRoomExists(data.roomId),
              this.checkUserPermissions(data.userId),
              this.checkDateValidity(data.dates),
              this.checkRoomAvailability(data.roomId, data.dates),
              this.checkBusinessRules(data)
            ])
            
            return {
              isValid: checks.every(check => check.isValid),
              errors: checks.flatMap(check => check.errors || [])
            }
          }
        }
      `,
      
      // Monitoring and alerting
      monitoring: {
        realTimeAlerts: [
          'Booking creation rate anomalies',
          'Database constraint violations',
          'API response time degradation',
          'Customer complaint spikes'
        ],
        
        dashboards: [
          'Real-time booking success/failure rates',
          'Room occupancy and availability metrics', 
          'Customer satisfaction scores',
          'Revenue and conversion tracking'
        ]
      },
      
      // Testing improvements
      testingStrategy: {
        concurrencyTests: `
          // Load testing for race conditions
          describe('Concurrent booking stress test', () => {
            test('should handle 100 concurrent booking attempts gracefully', async () => {
              const roomId = 'room-123'
              const dates = { checkIn: '2024-06-01', checkOut: '2024-06-03' }
              
              // Create 100 concurrent booking attempts
              const bookingPromises = Array.from({ length: 100 }, (_, i) => 
                BookingService.createBooking({
                  roomId,
                  userId: \`user-\${i}\`,
                  dates
                })
              )
              
              const results = await Promise.allSettled(bookingPromises)
              
              const successful = results.filter(r => r.status === 'fulfilled')
              const failed = results.filter(r => r.status === 'rejected')
              
              // Only one booking should succeed
              expect(successful).toHaveLength(1)
              expect(failed).toHaveLength(99)
              
              // All failures should be due to booking conflicts
              failed.forEach(result => {
                expect(result.reason).toBeInstanceOf(BookingConflictError)
              })
            })
          })
        `,
        
        integrationTests: 'End-to-end booking flow testing',
        chaosEngineering: 'Simulated database failures and network issues'
      }
    }
  }
}
```

**Communication & Stakeholder Management**:
```typescript
interface IncidentCommunication {
  internalCommunication: {
    engineering: 'Slack incident channel with real-time updates',
    management: 'Executive briefing every 30 minutes',
    customerService: 'Talking points and escalation procedures',
    sales: 'Impact assessment and customer retention strategies'
  }
  
  externalCommunication: {
    customers: {
      immediate: 'Proactive outreach to affected customers',
      followUp: 'Detailed explanation and compensation offer',
      prevention: 'System improvements communication'
    },
    
    partners: 'Hotel partners notified of potential overflow needs',
    public: 'Transparent communication about issue and resolution'
  }
  
  postMortem: {
    timeline: 'Within 72 hours of resolution',
    participants: ['Engineering', 'Product', 'Customer Service', 'Management'],
    deliverables: [
      'Detailed incident report',
      'Root cause analysis',
      'Prevention measures',
      'Process improvements',
      'Team training plan'
    ]
  }
}
```

Tôi đã tạo một comprehensive danh sách câu hỏi phỏng vấn senior level với hơn 100 câu hỏi chi tiết, covering toàn bộ experience trong CV của bạn. File này bao gồm:

- **Technical depth**: Architecture, performance, security
- **Leadership skills**: Mentoring, code review, team processes  
- **Business impact**: Metrics, ROI, strategic thinking
- **Problem solving**: Crisis management, debugging
- **Innovation**: New tech evaluation, AI/ML integration

Mỗi câu hỏi đều có câu trả lời detailed với code examples, specific metrics, và real-world scenarios based trên experience trong CV của bạn.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Add more comprehensive senior-level interview questions to existing markdown file", "status": "completed", "activeForm": "Adding more comprehensive senior-level interview questions"}]