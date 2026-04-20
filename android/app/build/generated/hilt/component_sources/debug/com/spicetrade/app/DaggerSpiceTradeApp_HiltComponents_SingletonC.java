package com.spicetrade.app;

import android.app.Activity;
import android.app.Service;
import android.view.View;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.SavedStateHandle;
import androidx.lifecycle.ViewModel;
import com.spicetrade.app.data.api.ApiService;
import com.spicetrade.app.data.preferences.UserPreferences;
import com.spicetrade.app.data.repository.AuthRepository;
import com.spicetrade.app.data.repository.MessageRepository;
import com.spicetrade.app.data.repository.ProductRepository;
import com.spicetrade.app.data.repository.ReviewRepository;
import com.spicetrade.app.data.repository.StoreRepository;
import com.spicetrade.app.data.repository.WishlistRepository;
import com.spicetrade.app.data.repository.impl.AuthRepositoryImpl;
import com.spicetrade.app.data.repository.impl.MessageRepositoryImpl;
import com.spicetrade.app.data.repository.impl.ProductRepositoryImpl;
import com.spicetrade.app.data.repository.impl.ReviewRepositoryImpl;
import com.spicetrade.app.data.repository.impl.StoreRepositoryImpl;
import com.spicetrade.app.data.repository.impl.WishlistRepositoryImpl;
import com.spicetrade.app.di.NetworkModule_ProvideApiServiceFactory;
import com.spicetrade.app.di.NetworkModule_ProvideOkHttpClientFactory;
import com.spicetrade.app.di.NetworkModule_ProvideRetrofitFactory;
import com.spicetrade.app.di.NetworkModule_ProvideUserPreferencesFactory;
import com.spicetrade.app.viewmodel.AuthViewModel;
import com.spicetrade.app.viewmodel.AuthViewModel_HiltModules;
import com.spicetrade.app.viewmodel.CartViewModel;
import com.spicetrade.app.viewmodel.CartViewModel_HiltModules;
import com.spicetrade.app.viewmodel.MessageViewModel;
import com.spicetrade.app.viewmodel.MessageViewModel_HiltModules;
import com.spicetrade.app.viewmodel.ProductViewModel;
import com.spicetrade.app.viewmodel.ProductViewModel_HiltModules;
import com.spicetrade.app.viewmodel.ReviewViewModel;
import com.spicetrade.app.viewmodel.ReviewViewModel_HiltModules;
import com.spicetrade.app.viewmodel.StoreViewModel;
import com.spicetrade.app.viewmodel.StoreViewModel_HiltModules;
import com.spicetrade.app.viewmodel.WishlistViewModel;
import com.spicetrade.app.viewmodel.WishlistViewModel_HiltModules;
import dagger.hilt.android.ActivityRetainedLifecycle;
import dagger.hilt.android.ViewModelLifecycle;
import dagger.hilt.android.internal.builders.ActivityComponentBuilder;
import dagger.hilt.android.internal.builders.ActivityRetainedComponentBuilder;
import dagger.hilt.android.internal.builders.FragmentComponentBuilder;
import dagger.hilt.android.internal.builders.ServiceComponentBuilder;
import dagger.hilt.android.internal.builders.ViewComponentBuilder;
import dagger.hilt.android.internal.builders.ViewModelComponentBuilder;
import dagger.hilt.android.internal.builders.ViewWithFragmentComponentBuilder;
import dagger.hilt.android.internal.lifecycle.DefaultViewModelFactories;
import dagger.hilt.android.internal.lifecycle.DefaultViewModelFactories_InternalFactoryFactory_Factory;
import dagger.hilt.android.internal.managers.ActivityRetainedComponentManager_LifecycleModule_ProvideActivityRetainedLifecycleFactory;
import dagger.hilt.android.internal.managers.SavedStateHandleHolder;
import dagger.hilt.android.internal.modules.ApplicationContextModule;
import dagger.hilt.android.internal.modules.ApplicationContextModule_ProvideContextFactory;
import dagger.internal.DaggerGenerated;
import dagger.internal.DoubleCheck;
import dagger.internal.IdentifierNameString;
import dagger.internal.KeepFieldType;
import dagger.internal.LazyClassKeyMap;
import dagger.internal.MapBuilder;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;
import okhttp3.OkHttpClient;
import retrofit2.Retrofit;

@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class DaggerSpiceTradeApp_HiltComponents_SingletonC {
  private DaggerSpiceTradeApp_HiltComponents_SingletonC() {
  }

  public static Builder builder() {
    return new Builder();
  }

  public static final class Builder {
    private ApplicationContextModule applicationContextModule;

    private Builder() {
    }

    public Builder applicationContextModule(ApplicationContextModule applicationContextModule) {
      this.applicationContextModule = Preconditions.checkNotNull(applicationContextModule);
      return this;
    }

    public SpiceTradeApp_HiltComponents.SingletonC build() {
      Preconditions.checkBuilderRequirement(applicationContextModule, ApplicationContextModule.class);
      return new SingletonCImpl(applicationContextModule);
    }
  }

  private static final class ActivityRetainedCBuilder implements SpiceTradeApp_HiltComponents.ActivityRetainedC.Builder {
    private final SingletonCImpl singletonCImpl;

    private SavedStateHandleHolder savedStateHandleHolder;

    private ActivityRetainedCBuilder(SingletonCImpl singletonCImpl) {
      this.singletonCImpl = singletonCImpl;
    }

    @Override
    public ActivityRetainedCBuilder savedStateHandleHolder(
        SavedStateHandleHolder savedStateHandleHolder) {
      this.savedStateHandleHolder = Preconditions.checkNotNull(savedStateHandleHolder);
      return this;
    }

    @Override
    public SpiceTradeApp_HiltComponents.ActivityRetainedC build() {
      Preconditions.checkBuilderRequirement(savedStateHandleHolder, SavedStateHandleHolder.class);
      return new ActivityRetainedCImpl(singletonCImpl, savedStateHandleHolder);
    }
  }

  private static final class ActivityCBuilder implements SpiceTradeApp_HiltComponents.ActivityC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private Activity activity;

    private ActivityCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
    }

    @Override
    public ActivityCBuilder activity(Activity activity) {
      this.activity = Preconditions.checkNotNull(activity);
      return this;
    }

    @Override
    public SpiceTradeApp_HiltComponents.ActivityC build() {
      Preconditions.checkBuilderRequirement(activity, Activity.class);
      return new ActivityCImpl(singletonCImpl, activityRetainedCImpl, activity);
    }
  }

  private static final class FragmentCBuilder implements SpiceTradeApp_HiltComponents.FragmentC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private Fragment fragment;

    private FragmentCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
    }

    @Override
    public FragmentCBuilder fragment(Fragment fragment) {
      this.fragment = Preconditions.checkNotNull(fragment);
      return this;
    }

    @Override
    public SpiceTradeApp_HiltComponents.FragmentC build() {
      Preconditions.checkBuilderRequirement(fragment, Fragment.class);
      return new FragmentCImpl(singletonCImpl, activityRetainedCImpl, activityCImpl, fragment);
    }
  }

  private static final class ViewWithFragmentCBuilder implements SpiceTradeApp_HiltComponents.ViewWithFragmentC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final FragmentCImpl fragmentCImpl;

    private View view;

    private ViewWithFragmentCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl,
        FragmentCImpl fragmentCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
      this.fragmentCImpl = fragmentCImpl;
    }

    @Override
    public ViewWithFragmentCBuilder view(View view) {
      this.view = Preconditions.checkNotNull(view);
      return this;
    }

    @Override
    public SpiceTradeApp_HiltComponents.ViewWithFragmentC build() {
      Preconditions.checkBuilderRequirement(view, View.class);
      return new ViewWithFragmentCImpl(singletonCImpl, activityRetainedCImpl, activityCImpl, fragmentCImpl, view);
    }
  }

  private static final class ViewCBuilder implements SpiceTradeApp_HiltComponents.ViewC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private View view;

    private ViewCBuilder(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
        ActivityCImpl activityCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
    }

    @Override
    public ViewCBuilder view(View view) {
      this.view = Preconditions.checkNotNull(view);
      return this;
    }

    @Override
    public SpiceTradeApp_HiltComponents.ViewC build() {
      Preconditions.checkBuilderRequirement(view, View.class);
      return new ViewCImpl(singletonCImpl, activityRetainedCImpl, activityCImpl, view);
    }
  }

  private static final class ViewModelCBuilder implements SpiceTradeApp_HiltComponents.ViewModelC.Builder {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private SavedStateHandle savedStateHandle;

    private ViewModelLifecycle viewModelLifecycle;

    private ViewModelCBuilder(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
    }

    @Override
    public ViewModelCBuilder savedStateHandle(SavedStateHandle handle) {
      this.savedStateHandle = Preconditions.checkNotNull(handle);
      return this;
    }

    @Override
    public ViewModelCBuilder viewModelLifecycle(ViewModelLifecycle viewModelLifecycle) {
      this.viewModelLifecycle = Preconditions.checkNotNull(viewModelLifecycle);
      return this;
    }

    @Override
    public SpiceTradeApp_HiltComponents.ViewModelC build() {
      Preconditions.checkBuilderRequirement(savedStateHandle, SavedStateHandle.class);
      Preconditions.checkBuilderRequirement(viewModelLifecycle, ViewModelLifecycle.class);
      return new ViewModelCImpl(singletonCImpl, activityRetainedCImpl, savedStateHandle, viewModelLifecycle);
    }
  }

  private static final class ServiceCBuilder implements SpiceTradeApp_HiltComponents.ServiceC.Builder {
    private final SingletonCImpl singletonCImpl;

    private Service service;

    private ServiceCBuilder(SingletonCImpl singletonCImpl) {
      this.singletonCImpl = singletonCImpl;
    }

    @Override
    public ServiceCBuilder service(Service service) {
      this.service = Preconditions.checkNotNull(service);
      return this;
    }

    @Override
    public SpiceTradeApp_HiltComponents.ServiceC build() {
      Preconditions.checkBuilderRequirement(service, Service.class);
      return new ServiceCImpl(singletonCImpl, service);
    }
  }

  private static final class ViewWithFragmentCImpl extends SpiceTradeApp_HiltComponents.ViewWithFragmentC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final FragmentCImpl fragmentCImpl;

    private final ViewWithFragmentCImpl viewWithFragmentCImpl = this;

    private ViewWithFragmentCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl,
        FragmentCImpl fragmentCImpl, View viewParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;
      this.fragmentCImpl = fragmentCImpl;


    }
  }

  private static final class FragmentCImpl extends SpiceTradeApp_HiltComponents.FragmentC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final FragmentCImpl fragmentCImpl = this;

    private FragmentCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, ActivityCImpl activityCImpl,
        Fragment fragmentParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;


    }

    @Override
    public DefaultViewModelFactories.InternalFactoryFactory getHiltInternalFactoryFactory() {
      return activityCImpl.getHiltInternalFactoryFactory();
    }

    @Override
    public ViewWithFragmentComponentBuilder viewWithFragmentComponentBuilder() {
      return new ViewWithFragmentCBuilder(singletonCImpl, activityRetainedCImpl, activityCImpl, fragmentCImpl);
    }
  }

  private static final class ViewCImpl extends SpiceTradeApp_HiltComponents.ViewC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl;

    private final ViewCImpl viewCImpl = this;

    private ViewCImpl(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
        ActivityCImpl activityCImpl, View viewParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;
      this.activityCImpl = activityCImpl;


    }
  }

  private static final class ActivityCImpl extends SpiceTradeApp_HiltComponents.ActivityC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ActivityCImpl activityCImpl = this;

    private ActivityCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, Activity activityParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;


    }

    @Override
    public void injectMainActivity(MainActivity mainActivity) {
    }

    @Override
    public DefaultViewModelFactories.InternalFactoryFactory getHiltInternalFactoryFactory() {
      return DefaultViewModelFactories_InternalFactoryFactory_Factory.newInstance(getViewModelKeys(), new ViewModelCBuilder(singletonCImpl, activityRetainedCImpl));
    }

    @Override
    public Map<Class<?>, Boolean> getViewModelKeys() {
      return LazyClassKeyMap.<Boolean>of(MapBuilder.<String, Boolean>newMapBuilder(7).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_AuthViewModel, AuthViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_CartViewModel, CartViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_MessageViewModel, MessageViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_ProductViewModel, ProductViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_ReviewViewModel, ReviewViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_StoreViewModel, StoreViewModel_HiltModules.KeyModule.provide()).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_WishlistViewModel, WishlistViewModel_HiltModules.KeyModule.provide()).build());
    }

    @Override
    public ViewModelComponentBuilder getViewModelComponentBuilder() {
      return new ViewModelCBuilder(singletonCImpl, activityRetainedCImpl);
    }

    @Override
    public FragmentComponentBuilder fragmentComponentBuilder() {
      return new FragmentCBuilder(singletonCImpl, activityRetainedCImpl, activityCImpl);
    }

    @Override
    public ViewComponentBuilder viewComponentBuilder() {
      return new ViewCBuilder(singletonCImpl, activityRetainedCImpl, activityCImpl);
    }

    @IdentifierNameString
    private static final class LazyClassKeyProvider {
      static String com_spicetrade_app_viewmodel_CartViewModel = "com.spicetrade.app.viewmodel.CartViewModel";

      static String com_spicetrade_app_viewmodel_StoreViewModel = "com.spicetrade.app.viewmodel.StoreViewModel";

      static String com_spicetrade_app_viewmodel_WishlistViewModel = "com.spicetrade.app.viewmodel.WishlistViewModel";

      static String com_spicetrade_app_viewmodel_ReviewViewModel = "com.spicetrade.app.viewmodel.ReviewViewModel";

      static String com_spicetrade_app_viewmodel_MessageViewModel = "com.spicetrade.app.viewmodel.MessageViewModel";

      static String com_spicetrade_app_viewmodel_AuthViewModel = "com.spicetrade.app.viewmodel.AuthViewModel";

      static String com_spicetrade_app_viewmodel_ProductViewModel = "com.spicetrade.app.viewmodel.ProductViewModel";

      @KeepFieldType
      CartViewModel com_spicetrade_app_viewmodel_CartViewModel2;

      @KeepFieldType
      StoreViewModel com_spicetrade_app_viewmodel_StoreViewModel2;

      @KeepFieldType
      WishlistViewModel com_spicetrade_app_viewmodel_WishlistViewModel2;

      @KeepFieldType
      ReviewViewModel com_spicetrade_app_viewmodel_ReviewViewModel2;

      @KeepFieldType
      MessageViewModel com_spicetrade_app_viewmodel_MessageViewModel2;

      @KeepFieldType
      AuthViewModel com_spicetrade_app_viewmodel_AuthViewModel2;

      @KeepFieldType
      ProductViewModel com_spicetrade_app_viewmodel_ProductViewModel2;
    }
  }

  private static final class ViewModelCImpl extends SpiceTradeApp_HiltComponents.ViewModelC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl;

    private final ViewModelCImpl viewModelCImpl = this;

    private Provider<AuthViewModel> authViewModelProvider;

    private Provider<CartViewModel> cartViewModelProvider;

    private Provider<MessageViewModel> messageViewModelProvider;

    private Provider<ProductViewModel> productViewModelProvider;

    private Provider<ReviewViewModel> reviewViewModelProvider;

    private Provider<StoreViewModel> storeViewModelProvider;

    private Provider<WishlistViewModel> wishlistViewModelProvider;

    private ViewModelCImpl(SingletonCImpl singletonCImpl,
        ActivityRetainedCImpl activityRetainedCImpl, SavedStateHandle savedStateHandleParam,
        ViewModelLifecycle viewModelLifecycleParam) {
      this.singletonCImpl = singletonCImpl;
      this.activityRetainedCImpl = activityRetainedCImpl;

      initialize(savedStateHandleParam, viewModelLifecycleParam);

    }

    @SuppressWarnings("unchecked")
    private void initialize(final SavedStateHandle savedStateHandleParam,
        final ViewModelLifecycle viewModelLifecycleParam) {
      this.authViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 0);
      this.cartViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 1);
      this.messageViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 2);
      this.productViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 3);
      this.reviewViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 4);
      this.storeViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 5);
      this.wishlistViewModelProvider = new SwitchingProvider<>(singletonCImpl, activityRetainedCImpl, viewModelCImpl, 6);
    }

    @Override
    public Map<Class<?>, javax.inject.Provider<ViewModel>> getHiltViewModelMap() {
      return LazyClassKeyMap.<javax.inject.Provider<ViewModel>>of(MapBuilder.<String, javax.inject.Provider<ViewModel>>newMapBuilder(7).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_AuthViewModel, ((Provider) authViewModelProvider)).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_CartViewModel, ((Provider) cartViewModelProvider)).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_MessageViewModel, ((Provider) messageViewModelProvider)).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_ProductViewModel, ((Provider) productViewModelProvider)).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_ReviewViewModel, ((Provider) reviewViewModelProvider)).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_StoreViewModel, ((Provider) storeViewModelProvider)).put(LazyClassKeyProvider.com_spicetrade_app_viewmodel_WishlistViewModel, ((Provider) wishlistViewModelProvider)).build());
    }

    @Override
    public Map<Class<?>, Object> getHiltViewModelAssistedMap() {
      return Collections.<Class<?>, Object>emptyMap();
    }

    @IdentifierNameString
    private static final class LazyClassKeyProvider {
      static String com_spicetrade_app_viewmodel_ProductViewModel = "com.spicetrade.app.viewmodel.ProductViewModel";

      static String com_spicetrade_app_viewmodel_WishlistViewModel = "com.spicetrade.app.viewmodel.WishlistViewModel";

      static String com_spicetrade_app_viewmodel_StoreViewModel = "com.spicetrade.app.viewmodel.StoreViewModel";

      static String com_spicetrade_app_viewmodel_MessageViewModel = "com.spicetrade.app.viewmodel.MessageViewModel";

      static String com_spicetrade_app_viewmodel_ReviewViewModel = "com.spicetrade.app.viewmodel.ReviewViewModel";

      static String com_spicetrade_app_viewmodel_AuthViewModel = "com.spicetrade.app.viewmodel.AuthViewModel";

      static String com_spicetrade_app_viewmodel_CartViewModel = "com.spicetrade.app.viewmodel.CartViewModel";

      @KeepFieldType
      ProductViewModel com_spicetrade_app_viewmodel_ProductViewModel2;

      @KeepFieldType
      WishlistViewModel com_spicetrade_app_viewmodel_WishlistViewModel2;

      @KeepFieldType
      StoreViewModel com_spicetrade_app_viewmodel_StoreViewModel2;

      @KeepFieldType
      MessageViewModel com_spicetrade_app_viewmodel_MessageViewModel2;

      @KeepFieldType
      ReviewViewModel com_spicetrade_app_viewmodel_ReviewViewModel2;

      @KeepFieldType
      AuthViewModel com_spicetrade_app_viewmodel_AuthViewModel2;

      @KeepFieldType
      CartViewModel com_spicetrade_app_viewmodel_CartViewModel2;
    }

    private static final class SwitchingProvider<T> implements Provider<T> {
      private final SingletonCImpl singletonCImpl;

      private final ActivityRetainedCImpl activityRetainedCImpl;

      private final ViewModelCImpl viewModelCImpl;

      private final int id;

      SwitchingProvider(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
          ViewModelCImpl viewModelCImpl, int id) {
        this.singletonCImpl = singletonCImpl;
        this.activityRetainedCImpl = activityRetainedCImpl;
        this.viewModelCImpl = viewModelCImpl;
        this.id = id;
      }

      @SuppressWarnings("unchecked")
      @Override
      public T get() {
        switch (id) {
          case 0: // com.spicetrade.app.viewmodel.AuthViewModel 
          return (T) new AuthViewModel(singletonCImpl.bindAuthRepositoryProvider.get(), singletonCImpl.provideUserPreferencesProvider.get());

          case 1: // com.spicetrade.app.viewmodel.CartViewModel 
          return (T) new CartViewModel();

          case 2: // com.spicetrade.app.viewmodel.MessageViewModel 
          return (T) new MessageViewModel(singletonCImpl.bindMessageRepositoryProvider.get());

          case 3: // com.spicetrade.app.viewmodel.ProductViewModel 
          return (T) new ProductViewModel(singletonCImpl.bindProductRepositoryProvider.get());

          case 4: // com.spicetrade.app.viewmodel.ReviewViewModel 
          return (T) new ReviewViewModel(singletonCImpl.bindReviewRepositoryProvider.get());

          case 5: // com.spicetrade.app.viewmodel.StoreViewModel 
          return (T) new StoreViewModel(singletonCImpl.bindStoreRepositoryProvider.get());

          case 6: // com.spicetrade.app.viewmodel.WishlistViewModel 
          return (T) new WishlistViewModel(singletonCImpl.bindWishlistRepositoryProvider.get());

          default: throw new AssertionError(id);
        }
      }
    }
  }

  private static final class ActivityRetainedCImpl extends SpiceTradeApp_HiltComponents.ActivityRetainedC {
    private final SingletonCImpl singletonCImpl;

    private final ActivityRetainedCImpl activityRetainedCImpl = this;

    private Provider<ActivityRetainedLifecycle> provideActivityRetainedLifecycleProvider;

    private ActivityRetainedCImpl(SingletonCImpl singletonCImpl,
        SavedStateHandleHolder savedStateHandleHolderParam) {
      this.singletonCImpl = singletonCImpl;

      initialize(savedStateHandleHolderParam);

    }

    @SuppressWarnings("unchecked")
    private void initialize(final SavedStateHandleHolder savedStateHandleHolderParam) {
      this.provideActivityRetainedLifecycleProvider = DoubleCheck.provider(new SwitchingProvider<ActivityRetainedLifecycle>(singletonCImpl, activityRetainedCImpl, 0));
    }

    @Override
    public ActivityComponentBuilder activityComponentBuilder() {
      return new ActivityCBuilder(singletonCImpl, activityRetainedCImpl);
    }

    @Override
    public ActivityRetainedLifecycle getActivityRetainedLifecycle() {
      return provideActivityRetainedLifecycleProvider.get();
    }

    private static final class SwitchingProvider<T> implements Provider<T> {
      private final SingletonCImpl singletonCImpl;

      private final ActivityRetainedCImpl activityRetainedCImpl;

      private final int id;

      SwitchingProvider(SingletonCImpl singletonCImpl, ActivityRetainedCImpl activityRetainedCImpl,
          int id) {
        this.singletonCImpl = singletonCImpl;
        this.activityRetainedCImpl = activityRetainedCImpl;
        this.id = id;
      }

      @SuppressWarnings("unchecked")
      @Override
      public T get() {
        switch (id) {
          case 0: // dagger.hilt.android.ActivityRetainedLifecycle 
          return (T) ActivityRetainedComponentManager_LifecycleModule_ProvideActivityRetainedLifecycleFactory.provideActivityRetainedLifecycle();

          default: throw new AssertionError(id);
        }
      }
    }
  }

  private static final class ServiceCImpl extends SpiceTradeApp_HiltComponents.ServiceC {
    private final SingletonCImpl singletonCImpl;

    private final ServiceCImpl serviceCImpl = this;

    private ServiceCImpl(SingletonCImpl singletonCImpl, Service serviceParam) {
      this.singletonCImpl = singletonCImpl;


    }
  }

  private static final class SingletonCImpl extends SpiceTradeApp_HiltComponents.SingletonC {
    private final ApplicationContextModule applicationContextModule;

    private final SingletonCImpl singletonCImpl = this;

    private Provider<UserPreferences> provideUserPreferencesProvider;

    private Provider<OkHttpClient> provideOkHttpClientProvider;

    private Provider<Retrofit> provideRetrofitProvider;

    private Provider<ApiService> provideApiServiceProvider;

    private Provider<AuthRepositoryImpl> authRepositoryImplProvider;

    private Provider<AuthRepository> bindAuthRepositoryProvider;

    private Provider<MessageRepositoryImpl> messageRepositoryImplProvider;

    private Provider<MessageRepository> bindMessageRepositoryProvider;

    private Provider<ProductRepositoryImpl> productRepositoryImplProvider;

    private Provider<ProductRepository> bindProductRepositoryProvider;

    private Provider<ReviewRepositoryImpl> reviewRepositoryImplProvider;

    private Provider<ReviewRepository> bindReviewRepositoryProvider;

    private Provider<StoreRepositoryImpl> storeRepositoryImplProvider;

    private Provider<StoreRepository> bindStoreRepositoryProvider;

    private Provider<WishlistRepositoryImpl> wishlistRepositoryImplProvider;

    private Provider<WishlistRepository> bindWishlistRepositoryProvider;

    private SingletonCImpl(ApplicationContextModule applicationContextModuleParam) {
      this.applicationContextModule = applicationContextModuleParam;
      initialize(applicationContextModuleParam);

    }

    @SuppressWarnings("unchecked")
    private void initialize(final ApplicationContextModule applicationContextModuleParam) {
      this.provideUserPreferencesProvider = DoubleCheck.provider(new SwitchingProvider<UserPreferences>(singletonCImpl, 4));
      this.provideOkHttpClientProvider = DoubleCheck.provider(new SwitchingProvider<OkHttpClient>(singletonCImpl, 3));
      this.provideRetrofitProvider = DoubleCheck.provider(new SwitchingProvider<Retrofit>(singletonCImpl, 2));
      this.provideApiServiceProvider = DoubleCheck.provider(new SwitchingProvider<ApiService>(singletonCImpl, 1));
      this.authRepositoryImplProvider = new SwitchingProvider<>(singletonCImpl, 0);
      this.bindAuthRepositoryProvider = DoubleCheck.provider((Provider) authRepositoryImplProvider);
      this.messageRepositoryImplProvider = new SwitchingProvider<>(singletonCImpl, 5);
      this.bindMessageRepositoryProvider = DoubleCheck.provider((Provider) messageRepositoryImplProvider);
      this.productRepositoryImplProvider = new SwitchingProvider<>(singletonCImpl, 6);
      this.bindProductRepositoryProvider = DoubleCheck.provider((Provider) productRepositoryImplProvider);
      this.reviewRepositoryImplProvider = new SwitchingProvider<>(singletonCImpl, 7);
      this.bindReviewRepositoryProvider = DoubleCheck.provider((Provider) reviewRepositoryImplProvider);
      this.storeRepositoryImplProvider = new SwitchingProvider<>(singletonCImpl, 8);
      this.bindStoreRepositoryProvider = DoubleCheck.provider((Provider) storeRepositoryImplProvider);
      this.wishlistRepositoryImplProvider = new SwitchingProvider<>(singletonCImpl, 9);
      this.bindWishlistRepositoryProvider = DoubleCheck.provider((Provider) wishlistRepositoryImplProvider);
    }

    @Override
    public void injectSpiceTradeApp(SpiceTradeApp spiceTradeApp) {
    }

    @Override
    public Set<Boolean> getDisableFragmentGetContextFix() {
      return Collections.<Boolean>emptySet();
    }

    @Override
    public ActivityRetainedComponentBuilder retainedComponentBuilder() {
      return new ActivityRetainedCBuilder(singletonCImpl);
    }

    @Override
    public ServiceComponentBuilder serviceComponentBuilder() {
      return new ServiceCBuilder(singletonCImpl);
    }

    private static final class SwitchingProvider<T> implements Provider<T> {
      private final SingletonCImpl singletonCImpl;

      private final int id;

      SwitchingProvider(SingletonCImpl singletonCImpl, int id) {
        this.singletonCImpl = singletonCImpl;
        this.id = id;
      }

      @SuppressWarnings("unchecked")
      @Override
      public T get() {
        switch (id) {
          case 0: // com.spicetrade.app.data.repository.impl.AuthRepositoryImpl 
          return (T) new AuthRepositoryImpl(singletonCImpl.provideApiServiceProvider.get());

          case 1: // com.spicetrade.app.data.api.ApiService 
          return (T) NetworkModule_ProvideApiServiceFactory.provideApiService(singletonCImpl.provideRetrofitProvider.get());

          case 2: // retrofit2.Retrofit 
          return (T) NetworkModule_ProvideRetrofitFactory.provideRetrofit(singletonCImpl.provideOkHttpClientProvider.get());

          case 3: // okhttp3.OkHttpClient 
          return (T) NetworkModule_ProvideOkHttpClientFactory.provideOkHttpClient(singletonCImpl.provideUserPreferencesProvider.get());

          case 4: // com.spicetrade.app.data.preferences.UserPreferences 
          return (T) NetworkModule_ProvideUserPreferencesFactory.provideUserPreferences(ApplicationContextModule_ProvideContextFactory.provideContext(singletonCImpl.applicationContextModule));

          case 5: // com.spicetrade.app.data.repository.impl.MessageRepositoryImpl 
          return (T) new MessageRepositoryImpl(singletonCImpl.provideApiServiceProvider.get());

          case 6: // com.spicetrade.app.data.repository.impl.ProductRepositoryImpl 
          return (T) new ProductRepositoryImpl(singletonCImpl.provideApiServiceProvider.get());

          case 7: // com.spicetrade.app.data.repository.impl.ReviewRepositoryImpl 
          return (T) new ReviewRepositoryImpl(singletonCImpl.provideApiServiceProvider.get());

          case 8: // com.spicetrade.app.data.repository.impl.StoreRepositoryImpl 
          return (T) new StoreRepositoryImpl(singletonCImpl.provideApiServiceProvider.get());

          case 9: // com.spicetrade.app.data.repository.impl.WishlistRepositoryImpl 
          return (T) new WishlistRepositoryImpl(singletonCImpl.provideApiServiceProvider.get());

          default: throw new AssertionError(id);
        }
      }
    }
  }
}
