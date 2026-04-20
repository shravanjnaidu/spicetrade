package com.spicetrade.app.viewmodel;

import com.spicetrade.app.data.repository.MessageRepository;
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
public final class MessageViewModel_Factory implements Factory<MessageViewModel> {
  private final Provider<MessageRepository> repositoryProvider;

  public MessageViewModel_Factory(Provider<MessageRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public MessageViewModel get() {
    return newInstance(repositoryProvider.get());
  }

  public static MessageViewModel_Factory create(Provider<MessageRepository> repositoryProvider) {
    return new MessageViewModel_Factory(repositoryProvider);
  }

  public static MessageViewModel newInstance(MessageRepository repository) {
    return new MessageViewModel(repository);
  }
}
