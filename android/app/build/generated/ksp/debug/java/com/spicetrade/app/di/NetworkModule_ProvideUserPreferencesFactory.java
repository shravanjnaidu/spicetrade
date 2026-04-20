package com.spicetrade.app.di;

import android.content.Context;
import com.spicetrade.app.data.preferences.UserPreferences;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata("dagger.hilt.android.qualifiers.ApplicationContext")
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
public final class NetworkModule_ProvideUserPreferencesFactory implements Factory<UserPreferences> {
  private final Provider<Context> contextProvider;

  public NetworkModule_ProvideUserPreferencesFactory(Provider<Context> contextProvider) {
    this.contextProvider = contextProvider;
  }

  @Override
  public UserPreferences get() {
    return provideUserPreferences(contextProvider.get());
  }

  public static NetworkModule_ProvideUserPreferencesFactory create(
      Provider<Context> contextProvider) {
    return new NetworkModule_ProvideUserPreferencesFactory(contextProvider);
  }

  public static UserPreferences provideUserPreferences(Context context) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideUserPreferences(context));
  }
}
