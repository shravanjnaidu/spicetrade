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
public final class MessageRepositoryImpl_Factory implements Factory<MessageRepositoryImpl> {
  private final Provider<ApiService> apiServiceProvider;

  public MessageRepositoryImpl_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public MessageRepositoryImpl get() {
    return newInstance(apiServiceProvider.get());
  }

  public static MessageRepositoryImpl_Factory create(Provider<ApiService> apiServiceProvider) {
    return new MessageRepositoryImpl_Factory(apiServiceProvider);
  }

  public static MessageRepositoryImpl newInstance(ApiService apiService) {
    return new MessageRepositoryImpl(apiService);
  }
}
