import React, { useState, useRef, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/theme'
import { typography } from '../theme/typography'

interface Message {
  id: string
  text: string
  sender: 'user' | 'support' | 'ai'
  timestamp: Date
  type: 'text' | 'system'
}

export function SupportTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Welcome to AVISHU Support',
      sender: 'ai',
      timestamp: new Date(),
      type: 'system'
    },
    {
      id: '2',
      text: 'How can we help you today?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  const aiResponses = [
    "Thank you for contacting AVISHU Support. Your order status can be checked in the 'Profile · Orders' section of the app.",
    "For order modifications, please contact your local franchisee directly as they manage order acceptance and changes.",
    "Delivery times vary by location and production schedule. Please check your order timeline for estimated readiness.",
    "To track your order, navigate to 'Profile · Orders' where you'll see the current status and progress.",
    "For returns and exchanges, please visit your local AVISHU franchisee with your order confirmation.",
    "Our premium collection features structured designs with minimalist aesthetics. Explore the catalog to see current offerings.",
    "Sizing information is available in each product's detailed view. If you need further assistance, our franchisees can help with measurements.",
    "Payment is processed upon order confirmation. You'll receive a receipt via email once your order is accepted."
  ]

  const preWrittenResponses = [
    "Order Status Inquiry",
    "Return Policy",
    "Sizing Help",
    "Payment Questions",
    "Product Availability",
    "Delivery Timeline",
    "Franchise Locations",
    "Custom Orders"
  ]

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages])

  const sendMessage = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 2000)
  }

  const sendPreWrittenResponse = (response: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: response,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    
    // Find appropriate AI response based on the query type
    let aiResponse = "Let me check that for you..."
    
    if (response.includes("Order Status")) {
      aiResponse = "Your order status can be viewed in the 'Profile · Orders' section. Orders move through Placed → In Production → Ready stages."
    } else if (response.includes("Return")) {
      aiResponse = "Returns are handled by your local franchisee. Please visit them with your order confirmation within 14 days of receipt."
    } else if (response.includes("Sizing")) {
      aiResponse = "Our structured fit runs true to size. For precise measurements, please visit your nearest AVISHU location for consultation."
    } else if (response.includes("Payment")) {
      aiResponse = "Payment is processed upon order confirmation. Corporate orders may be arranged through your franchisee representative."
    } else if (response.includes("Availability")) {
      aiResponse = "Current collection items are available for immediate purchase. Pre-order items have specified ready dates in the product details."
    } else if (response.includes("Delivery")) {
      aiResponse = "Delivery timelines depend on production schedule and location. Standard delivery is 7-10 business days for in-stock items."
    } else if (response.includes("Locations")) {
      aiResponse = "AVISHU operates through a franchise model. Please use our store locator or contact support for nearest location details."
    } else if (response.includes("Custom")) {
      aiResponse = "Custom orders are available through select franchise locations. Please consult with your local AVISHU representative for options."
    }

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, aiMessage])
    }, 1500)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'For immediate assistance, please call our support line at +91-XXX-XXX-XXXX or visit your local AVISHU franchisee.',
      [
        { text: 'Call Now', onPress: () => Alert.alert('Feature', 'Phone integration would be added in production') },
        { text: 'Visit Franchisee', onPress: () => Alert.alert('Feature', 'Store locator would be added in production') },
        { text: 'Cancel', style: 'cancel' }
      ]
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SUPPORT</Text>
        <Text style={styles.headerSubtitle}>AI Chat & Customer Service</Text>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message) => (
          <View key={message.id} style={[
            styles.messageBubble,
            message.sender === 'user' ? styles.userMessage : styles.supportMessage,
            message.type === 'system' && styles.systemMessage
          ]}>
            {message.sender !== 'user' && (
              <View style={styles.avatar}>
                <MaterialIcons 
                  name={message.sender === 'ai' ? 'smart-toy' : 'headset-mic'} 
                  size={20} 
                  color={colors.text} 
                />
              </View>
            )}
            
            <View style={styles.messageContent}>
              <Text style={[
                styles.messageText,
                message.sender === 'user' && styles.userMessageText
              ]}>
                {message.text}
              </Text>
              <Text style={styles.messageTime}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        ))}
        
        {isTyping && (
          <View style={[styles.messageBubble, styles.supportMessage]}>
            <View style={styles.avatar}>
              <MaterialIcons name="smart-toy" size={20} color={colors.text} />
            </View>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pre-written Responses */}
      <View style={styles.quickResponses}>
        <Text style={styles.quickResponsesTitle}>Quick Questions:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickResponsesScroll}
          contentContainerStyle={styles.quickResponsesContent}
        >
          {preWrittenResponses.map((response, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickResponseBtn}
              onPress={() => sendPreWrittenResponse(response)}
            >
              <Text style={styles.quickResponseText}>{response}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor={colors.textDim}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={colors.bg} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.supportContactBtn} onPress={handleContactSupport}>
          <MaterialIcons name="call" size={20} color={colors.text} />
          <Text style={styles.supportContactText}>Contact Human Support</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageBubble: {
    flexDirection: 'row',
    marginVertical: 8,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.text,
    borderColor: colors.text,
    marginLeft: 40,
  },
  supportMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    marginRight: 40,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.line,
    maxWidth: '60%',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.bg,
  },
  messageTime: {
    ...typography.micro,
    color: colors.textDim,
    marginTop: 6,
    textAlign: 'right',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textDim,
    marginHorizontal: 2,
  },
  quickResponses: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  quickResponsesTitle: {
    ...typography.caption,
    color: colors.textDim,
    marginBottom: 8,
  },
  quickResponsesScroll: {
    maxHeight: 80,
  },
  quickResponsesContent: {
    flexDirection: 'row',
    gap: 8,
  },
  quickResponseBtn: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickResponseText: {
    ...typography.micro,
    color: colors.text,
    fontSize: 11,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    maxHeight: 100,
    paddingRight: 12,
  },
  sendButton: {
    backgroundColor: colors.text,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.line,
    opacity: 0.5,
  },
  supportContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
  },
  supportContactText: {
    ...typography.caption,
    color: colors.text,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
})