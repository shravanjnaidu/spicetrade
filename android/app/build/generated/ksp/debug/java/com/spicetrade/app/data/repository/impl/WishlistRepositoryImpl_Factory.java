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
public final class WishlistRepositoryImpl_Factory implements Factory<WishlistRepositoryImpl> {
  private final Provider<ApiService> apiServiceProvider;

  public WishlistRepositoryImpl_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public WishlistRepositoryImpl get() {
    return newInstance(apiServiceProvider.get());
  }

  public static WishlistRepositoryImpl_Factory create(Provider<ApiService> apiServiceProvider) {
    return new WishlistRepositoryImpl_Factory(apiServiceProvider);
  }

  public static WishlistRepositoryImpl newInstance(ApiService apiService) {
    return new WishlistRepositoryImpl(apiService);
  }
}
