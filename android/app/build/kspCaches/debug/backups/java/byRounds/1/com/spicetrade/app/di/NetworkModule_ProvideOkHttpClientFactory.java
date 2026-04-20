package com.spicetrade.app.di;

import com.spicetrade.app.data.preferences.UserPreferences;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;
import okhttp3.OkHttpClient;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
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
public final class NetworkModule_ProvideOkHttpClientFactory implements Factory<OkHttpClient> {
  private final Provider<UserPreferences> userPreferencesProvider;

  public NetworkModule_ProvideOkHttpClientFactory(
      Provider<UserPreferences> userPreferencesProvider) {
    this.userPreferencesProvider = userPreferencesProvider;
  }

  @Override
  public OkHttpClient get() {
    return provideOkHttpClient(userPreferencesProvider.get());
  }

  public static NetworkModule_ProvideOkHttpClientFactory create(
      Provider<UserPreferences> userPreferencesProvider) {
    return new NetworkModule_ProvideOkHttpClientFactory(userPreferencesProvider);
  }

  public static OkHttpClient provideOkHttpClient(UserPreferences userPreferences) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideOkHttpClient(userPreferences));
  }
}
