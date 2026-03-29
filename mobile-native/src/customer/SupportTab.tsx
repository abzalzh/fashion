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

const AI_API_URL = 'http://localhost:8000'

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

  const fallbackResponses: Record<string, string> = {
    "Order Status Inquiry": "Your order status can be viewed in the 'Profile · Orders' section. Orders move through Placed → In Production → Ready stages.",
    "Return Policy": "Returns are handled by your local franchisee. Please visit them with your order confirmation within 14 days of receipt.",
    "Sizing Help": "Our structured fit runs true to size. For precise measurements, please visit your nearest AVISHU location for consultation.",
    "Payment Questions": "Payment is processed upon order confirmation. Corporate orders may be arranged through your franchisee representative.",
    "Product Availability": "Current collection items are available for immediate purchase. Pre-order items have specified ready dates in the product details.",
    "Delivery Timeline": "Delivery timelines depend on production schedule and location. Standard delivery is 7-10 business days for in-stock items.",
    "Franchise Locations": "AVISHU operates through a franchise model. Please use our store locator or contact support for nearest location details.",
    "Custom Orders": "Custom orders are available through select franchise locations. Please consult with your local AVISHU representative for options."
  }

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages])

  const getFallbackResponse = (message: string): string => {
    const lowerMsg = message.toLowerCase()
    if (lowerMsg.includes('order') || lowerMsg.includes('status')) {
      return "Your order status can be viewed in the 'Profile · Orders' section. Orders move through Placed → In Production → Ready stages."
    } else if (lowerMsg.includes('return')) {
      return "Returns are handled by your local franchisee. Please visit them with your order confirmation within 14 days."
    } else if (lowerMsg.includes('size')) {
      return "Our structured fit runs true to size. For precise measurements, please visit your nearest AVISHU location."
    } else if (lowerMsg.includes('payment') || lowerMsg.includes('pay')) {
      return "Payment is processed upon order confirmation. We accept all major credit cards and UPI."
    } else if (lowerMsg.includes('delivery') || lowerMsg.includes('shipping')) {
      return "Standard delivery takes 5-7 business days. Express delivery available for additional fee."
    }
    return "Thank you for your message. A support representative will assist you shortly."
  }

  const sendMessage = async () => {
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

    try {
      const response = await fetch(`${AI_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.text,
          conversation_history: messages.map(m => ({ text: m.text, sender: m.sender }))
        })
      })

      if (!response.ok) throw new Error('AI service unavailable')

      const data = await response.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const fallbackResponse = getFallbackResponse(userMessage.text)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const sendPreWrittenResponse = async (response: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: response,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      const res = await fetch(`${AI_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: response })
      })

      if (!res.ok) throw new Error('AI service unavailable')

      const data = await res.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponses[response] || "Thank you for your inquiry. How else can I help you?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      
      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsTyping(false)
    }
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SUPPORT</Text>
        <Text style={styles.headerSubtitle}>AI Chat & Customer Service</Text>
      </View>

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
