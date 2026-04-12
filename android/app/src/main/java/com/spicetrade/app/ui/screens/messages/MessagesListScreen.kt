package com.spicetrade.app.ui.screens.messages

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spicetrade.app.data.models.Conversation
import com.spicetrade.app.ui.theme.BrandRed
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.MessageViewModel

@Composable
fun MessagesListScreen(
    authViewModel: AuthViewModel,
    messageViewModel: MessageViewModel
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val conversations by messageViewModel.conversations.collectAsState()
    val isLoading by messageViewModel.isLoading.collectAsState()

    var selectedConversation by remember { mutableStateOf<Conversation?>(null) }

    LaunchedEffect(currentUser) {
        currentUser?.id?.let { messageViewModel.loadConversations(it) }
    }

    if (selectedConversation != null) {
        ChatScreen(
            conversation = selectedConversation!!,
            authViewModel = authViewModel,
            messageViewModel = messageViewModel,
            onBack = {
                selectedConversation = null
                currentUser?.id?.let { messageViewModel.loadConversations(it) }
            }
        )
        return
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF5F5F5))) {
        Box(
            modifier = Modifier.fillMaxWidth()
                .background(BrandRed)
                .padding(16.dp)
        ) {
            Text("Messages", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White)
        }

        if (isLoading && conversations.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandRed)
            }
        } else if (conversations.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("💬", fontSize = 48.sp)
                    Text("No Messages", fontWeight = FontWeight.Bold)
                    Text("Your conversations will appear here", color = Color.Gray, fontSize = 13.sp)
                }
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(conversations) { conv ->
                    ConversationRow(
                        conversation = conv,
                        currentUserId = currentUser?.id ?: 0,
                        onClick = { selectedConversation = conv }
                    )
                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                }
            }
        }
    }
}

@Composable
private fun ConversationRow(
    conversation: Conversation,
    currentUserId: Int,
    onClick: () -> Unit
) {
    val isBuyer = conversation.buyerId == currentUserId
    val otherName = if (isBuyer) conversation.sellerName ?: conversation.storeName ?: "Seller"
                    else conversation.buyerName ?: "Buyer"
    val unread = (conversation.unreadCount ?: 0) > 0

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.size(48.dp).clip(CircleShape).background(BrandRed.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Text(otherName.take(1).uppercase(), fontSize = 20.sp, fontWeight = FontWeight.Bold, color = BrandRed)
        }

        Spacer(Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                otherName,
                fontWeight = if (unread) FontWeight.Bold else FontWeight.Normal,
                fontSize = 15.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                conversation.lastMessage ?: "No messages yet",
                fontSize = 13.sp,
                color = if (unread) Color.DarkGray else Color.Gray,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        Column(horizontalAlignment = Alignment.End) {
            conversation.lastMessageTime?.let {
                Text(it.take(10), fontSize = 11.sp, color = Color.Gray)
            }
            if (unread) {
                Spacer(Modifier.height(4.dp))
                Box(
                    modifier = Modifier.size(18.dp).clip(CircleShape).background(BrandRed),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        (conversation.unreadCount ?: 0).toString(),
                        fontSize = 10.sp,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
