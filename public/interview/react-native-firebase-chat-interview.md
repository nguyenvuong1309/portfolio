# Trả lời phỏng vấn: Hệ thống Chat Realtime với Firebase và React Native

_Dưới đây là cách tôi sẽ trả lời câu hỏi phỏng vấn về xây dựng hệ thống chat realtime_

---

**Interviewer: "Bạn có thể giải thích cách xây dựng một hệ thống chat realtime bằng Firebase và React Native không?"**

**Câu trả lời:**

Vâng, tôi sẽ giải thích chi tiết về hệ thống chat realtime. Trước tiên, tôi muốn nói về kiến trúc tổng quan.

## Kiến trúc và Lựa chọn Công nghệ

Với Firebase, tôi sẽ chọn **Firestore Database** thay vì Realtime Database vì một số lý do quan trọng. Firestore có khả năng query phức tạp hơn, hỗ trợ offline tốt hơn, và cấu trúc dữ liệu linh hoạt hơn - điều này rất quan trọng cho một ứng dụng chat.

Về phía React Native, tôi sẽ sử dụng `@react-native-firebase/firestore` để tương tác với backend. Đây là SDK chính thức và có performance tốt nhất.

## Cấu trúc Database

Tôi sẽ thiết kế 3 collections chính:

```javascript
// Collection: conversations
{
  id: "conv_123",
  participants: ["user1", "user2"],
  lastMessage: "Chào bạn!",
  lastMessageTime: timestamp,
  createdAt: timestamp,
  unreadCount: {
    user1: 0,
    user2: 2
  }
}

// Collection: messages
{
  id: "msg_456",
  conversationId: "conv_123",
  senderId: "user1",
  text: "Chào bạn!",
  timestamp: timestamp,
  type: "text",
  status: "delivered" // sent, delivered, read
}

// Collection: users
{
  id: "user1",
  name: "Nguyễn Văn A",
  avatar: "url",
  isOnline: true,
  lastSeen: timestamp
}
```

Lý do tôi tách riêng conversations là để dễ dàng hiển thị danh sách chat và manage metadata mà không cần load hết messages.

## Cơ chế Realtime của Firebase

Đây là phần quan trọng nhất. Firebase có thể realtime được nhờ **WebSocket protocol**. Khác với HTTP request truyền thống theo kiểu request-response, WebSocket tạo ra một persistent connection hai chiều giữa client và server.

Cụ thể là:

1. Khi app khởi động, Firebase SDK tự động thiết lập WebSocket connection
2. Client đăng ký listeners thông qua `onSnapshot()`
3. Server maintain một danh sách các clients đang listen từng collection
4. Khi có thay đổi, server ngay lập tức push data qua WebSocket
5. Client nhận được event và update UI ngay lập tức

Điều hay ở đây là Firebase chỉ gửi **delta changes** - tức là chỉ những gì thay đổi, không gửi lại toàn bộ dataset. Điều này giúp tiết kiệm bandwidth rất nhiều.

## Luồng hoạt động chi tiết

### Bước 1: Khởi tạo và lắng nghe

```javascript
useEffect(() => {
  const unsubscribe = firestore()
    .collection("messages")
    .where("conversationId", "==", conversationId)
    .orderBy("timestamp", "asc")
    .limit(50) // Pagination
    .onSnapshot(
      (snapshot) => {
        const newMessages = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            newMessages.push(change.doc.data());
          }
        });
        setMessages((prev) => [...prev, ...newMessages]);
      },
      (error) => console.log("Listen error:", error)
    );

  return () => unsubscribe(); // Cleanup
}, [conversationId]);
```

### Bước 2: Gửi tin nhắn

```javascript
const sendMessage = async (text) => {
  try {
    // Tạo optimistic update trước
    const tempMessage = {
      id: generateTempId(),
      text,
      senderId: currentUserId,
      timestamp: new Date(),
      status: "sending",
    };
    setMessages((prev) => [...prev, tempMessage]);

    // Gửi lên server
    await firestore().collection("messages").add({
      text,
      senderId: currentUserId,
      conversationId,
      timestamp: firestore.FieldValue.serverTimestamp(),
      type: "text",
    });

    // Update conversation metadata
    await firestore().collection("conversations").doc(conversationId).update({
      lastMessage: text,
      lastMessageTime: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Handle error, remove optimistic update
    setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    showError("Gửi tin nhắn thất bại");
  }
};
```

## Xử lý Offline và Performance

Một điều tuyệt vời của Firebase là **offline support** built-in. Firestore tự động cache data locally, nên khi mất mạng:

- User vẫn xem được messages cũ
- Có thể gửi messages (sẽ queue lại)
- Khi có mạng, tự động sync

Về performance, tôi sẽ implement:

```javascript
// Lazy loading khi scroll
const loadMoreMessages = () => {
  const lastMessage = messages[0];
  firestore()
    .collection("messages")
    .where("conversationId", "==", conversationId)
    .orderBy("timestamp", "desc")
    .startAfter(lastMessage.timestamp)
    .limit(20)
    .get()
    .then((snapshot) => {
      // Prepend to messages array
    });
};
```

## Presence System (Online/Offline Status)

Để hiển thị trạng thái online/offline, tôi sẽ kết hợp Realtime Database vì nó có disconnect handler tốt hơn:

```javascript
// Monitor connection status
useEffect(() => {
  const connectedRef = firebase.database().ref(".info/connected");
  const userStatusRef = firebase.database().ref(`/status/${currentUserId}`);

  connectedRef.on("value", (snapshot) => {
    if (snapshot.val() === true) {
      userStatusRef.onDisconnect().set({
        isOnline: false,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
      });

      userStatusRef.set({
        isOnline: true,
        lastSeen: firebase.database.ServerValue.TIMESTAMP,
      });
    }
  });
}, []);
```

## Bảo mật

Security Rules rất quan trọng:

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages: chỉ participants mới đọc được
    match /messages/{messageId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participants;
    }

    // Conversations: chỉ participants
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.participants;
    }
  }
}
```

## Tối ưu và Scale

Khi hệ thống lớn, tôi sẽ:

1. **Sharding conversations** theo timestamp hoặc region
2. **Cloud Functions** để xử lý push notifications
3. **Compression** cho file/image messages
4. **CDN** cho media files

Về monitoring, Firebase Analytics sẽ track:

- Message delivery rate
- App crashes khi realtime
- Network usage

## Kết luận

Tóm lại, sức mạnh của Firebase realtime nằm ở WebSocket connection và event-driven architecture. Client không cần poll server, mà server chủ động push changes. Kết hợp với offline support và security rules mạnh mẽ, chúng ta có thể xây dựng một hệ thống chat rất robust và scalable.

Điều quan trọng nhất là phải hiểu rõ lifecycle của listeners, cleanup properly để tránh memory leaks, và luôn handle error cases gracefully.

---

_"Tôi có thể demo live coding nếu cần, hoặc giải thích sâu hơn về bất kỳ phần nào anh/chị muốn."_
