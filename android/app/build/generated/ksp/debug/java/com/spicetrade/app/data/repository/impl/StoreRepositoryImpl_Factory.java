package com.spicetrade.app.data.repository.impl;

import com.spicetrade.app.data.api.ApiService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
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
public final class StoreRepositoryImpl_Factory implements Factory<StoreRepositoryImpl> {
  private final Provider<ApiService> apiServiceProvider;

  public StoreRepositoryImpl_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public StoreRepositoryImpl get() {
    return newInstance(apiServiceProvider.get());
  }

  public static StoreRepositoryImpl_Factory create(Provider<ApiService> apiServiceProvider) {
    return new StoreRepositoryImpl_Factory(apiServiceProvider);
  }

  public static StoreRepositoryImpl newInstance(ApiService apiService) {
    return new StoreRepositoryImpl(apiService);
  }
}
