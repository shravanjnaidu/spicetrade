package com.spicetrade.app.di

import android.content.Context
import com.spicetrade.app.BuildConfig
import com.spicetrade.app.data.api.ApiService
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.data.api.AuthInterceptor
import com.spicetrade.app.data.api.LocalFallbackInterceptor
import com.spicetrade.app.data.preferences.UserPreferences
import com.spicetrade.app.data.repository.AuthRepository
import com.spicetrade.app.data.repository.BannerAdRepository
import com.spicetrade.app.data.repository.MessageRepository
import com.spicetrade.app.data.repository.ProductRepository
import com.spicetrade.app.data.repository.ReviewRepository
import com.spicetrade.app.data.repository.StoreRepository
import com.spicetrade.app.data.repository.WishlistRepository
import com.spicetrade.app.data.repository.impl.AuthRepositoryImpl
import com.spicetrade.app.data.repository.impl.BannerAdRepositoryImpl
import com.spicetrade.app.data.repository.impl.MessageRepositoryImpl
import com.spicetrade.app.data.repository.impl.ProductRepositoryImpl
import com.spicetrade.app.data.repository.impl.ReviewRepositoryImpl
import com.spicetrade.app.data.repository.impl.StoreRepositoryImpl
import com.spicetrade.app.data.repository.impl.WishlistRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Qualifier
import javax.inject.Singleton

/** Qualifier for the application-level [CoroutineScope]. */
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class ApplicationScope

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    @ApplicationScope
    fun provideApplicationScope(): CoroutineScope =
        CoroutineScope(SupervisorJob() + Dispatchers.Default)

    @Provides
    @Singleton
    fun provideOkHttpClient(
        userPreferences: UserPreferences,
        @ApplicationScope appScope: CoroutineScope
    ): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC
                    else HttpLoggingInterceptor.Level.NONE
        }
        return OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(userPreferences, appScope))
            .addInterceptor(LocalFallbackInterceptor())
            .addInterceptor(logging)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl(ApiConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService =
        retrofit.create(ApiService::class.java)

    @Provides
    @Singleton
    fun provideUserPreferences(@ApplicationContext context: Context): UserPreferences =
        UserPreferences(context)
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindProductRepository(impl: ProductRepositoryImpl): ProductRepository

    @Binds
    @Singleton
    abstract fun bindStoreRepository(impl: StoreRepositoryImpl): StoreRepository

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindMessageRepository(impl: MessageRepositoryImpl): MessageRepository

    @Binds
    @Singleton
    abstract fun bindWishlistRepository(impl: WishlistRepositoryImpl): WishlistRepository

    @Binds
    @Singleton
    abstract fun bindReviewRepository(impl: ReviewRepositoryImpl): ReviewRepository

    @Binds
    @Singleton
    abstract fun bindBannerAdRepository(impl: BannerAdRepositoryImpl): BannerAdRepository
}
