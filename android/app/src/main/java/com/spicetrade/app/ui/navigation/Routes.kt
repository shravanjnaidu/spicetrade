package com.spicetrade.app.ui.navigation

object Routes {
    const val WELCOME = "welcome"
    const val LOGIN = "login"
    const val SIGNUP = "signup"
    const val HOME = "home"
    const val PRODUCT_DETAIL = "product/{productId}"
    const val STORES = "stores"
    const val STORE_DETAIL = "store/{storeId}"
    const val WISHLIST = "wishlist"
    const val SELLER_DASHBOARD = "seller_dashboard"
    const val MESSAGES = "messages"
    const val CHAT = "chat/{conversationId}"
    const val PROFILE = "profile"
    const val CONTACT_SELLER = "contact_seller/{sellerId}/{adId}"
    const val POST_REQUIREMENT = "post_requirement"
    const val FORGOT_PASSWORD = "forgot_password"

    fun productDetail(productId: Int) = "product/$productId"
    fun storeDetail(storeId: Int) = "store/$storeId"
    fun chat(conversationId: Int) = "chat/$conversationId"
    fun contactSeller(sellerId: Int, adId: Int) = "contact_seller/$sellerId/$adId"
}
