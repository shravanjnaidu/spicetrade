package com.spicetrade.app.ui.screens.messages

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.spicetrade.app.data.models.Conversation
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.MessageViewModel
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    conversation: Conversation,
    authViewModel: AuthViewModel,
    messageViewModel: MessageViewModel,
    onBack: () -> Unit
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val messages by messageViewModel.messages.collectAsState()
    val isLoading by messageViewModel.isLoading.collectAsState()

    var messageText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    val isBuyer = conversation.buyerId == currentUser?.id
    val otherName = if (isBuyer) conversation.sellerName ?: conversation.storeName ?: "Seller"
                    else conversation.buyerName ?: "Buyer"

    LaunchedEffect(conversation.id) {
        messageViewModel.loadMessages(conversation.id)
        currentUser?.id?.let { messageViewModel.markAsRead(conversation.id, it) }
        // Poll for new messages while this screen is open
        while (true) {
            delay(3_000L)
            messageViewModel.loadMessages(conversation.id)
        }
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.scrollToItem(messages.size - 1)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(otherName, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        conversation.storeName?.takeIf { !isBuyer }?.let {
                            Text(it, fontSize = 12.sp, color = Color.White.copy(alpha = 0.8f))
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Back") }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = BrandOrange,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        },
        bottomBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = messageText,
                    onValueChange = { messageText = it },
                    placeholder = { Text("Type a message…") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(24.dp),
                    maxLines = 4
                )
                Spacer(Modifier.width(8.dp))
                IconButton(
                    onClick = {
                        currentUser?.id?.let { uid ->
                            val msg = messageText.trim()
                            if (msg.isNotEmpty()) {
                                messageViewModel.sendMessage(conversation.id, uid, msg)
                                messageText = ""
                            }
                        }
                    },
                    modifier = Modifier.size(48.dp).background(BrandOrange, shape = RoundedCornerShape(24.dp))
                ) {
                    Icon(Icons.Default.Send, "Send", tint = Color.White)
                }
            }
        }
    ) { innerPadding ->
        if (isLoading && messages.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandOrange)
            }
        } else {
            LazyColumn(
                state = listState,
                modifier = Modifier.fillMaxSize().padding(innerPadding).background(Color(0xFFF5F5F5)),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(messages) { message ->
                    val isMe = message.senderId == currentUser?.id
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start
                    ) {
                        Column(horizontalAlignment = if (isMe) Alignment.End else Alignment.Start) {
                            Box(
                                modifier = Modifier
                                    .widthIn(max = 280.dp)
                                    .background(
                                        color = if (isMe) BrandOrange else Color.White,
                                        shape = RoundedCornerShape(
                                            topStart = 16.dp, topEnd = 16.dp,
                                            bottomStart = if (isMe) 16.dp else 4.dp,
                                            bottomEnd = if (isMe) 4.dp else 16.dp
                                        )
                                    )
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Text(
                                    message.message,
                                    color = if (isMe) Color.White else Color.Black,
                                    fontSize = 14.sp
                                )
                            }
                            Text(
                                message.createdAt?.take(16) ?: "",
                                fontSize = 10.sp,
                                color = Color.Gray,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
